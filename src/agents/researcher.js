import callGemini from '../utils/apiClient.js';
import SearchProviderFactory from '../providers/search/SearchProviderFactory.js';
import SearchCache from '../core/cache.js';
import eventBus from '../core/eventBus.js';

export async function runResearcherAgent(db, queries, config) {
  eventBus.emitEvent('agent:start', { name: 'research' });

  const cache = new SearchCache(db, config.cache_expiry_hours || 12);
  const city = config.city || 'Pune';
  const primaryProviderName = config.searchProvider || 'tavily';
  
  let queriesExecuted = 0;
  let cacheHits = 0;

  const results = {
    projects: [],
    market: [],
    infrastructure: []
  };

  const tracks = ['projects', 'market', 'infrastructure'];

  try {
    // Instantiate primary provider (validates config immediately)
    const primaryProvider = SearchProviderFactory.getProvider(primaryProviderName);

    for (const track of tracks) {
      const trackQueries = queries[track] || [];
      
      for (const query of trackQueries) {
        // 1. Check Intelligent Cache
        const cachedResult = await cache.get(query);
        if (cachedResult) {
          cacheHits++;
          results[track].push({
            query,
            source: 'cache',
            data: cachedResult
          });
          continue;
        }

        // 2. Perform Research using Provider Architecture
        queriesExecuted++;
        let searchResults = [];
        let searchSource = primaryProviderName;

        try {
          // Attempt search via primary provider
          searchResults = await primaryProvider.search(query);
        } catch (providerError) {
          console.warn(`[Researcher] Primary search provider "${primaryProviderName}" failed: ${providerError.message}. Falling back to Gemini Search.`);
          
          try {
            // Fallback to Gemini search provider
            const fallbackProvider = SearchProviderFactory.getProvider('gemini');
            searchResults = await fallbackProvider.search(query);
            searchSource = 'gemini_fallback';
          } catch (fallbackError) {
            console.error(`[Researcher] Fallback search provider failed: ${fallbackError.message}`);
            throw fallbackError;
          }
        }

        // 3. Compile normalized results into a text context block
        const formattedSearchText = searchResults.map((r, idx) => 
          `[Source ${idx + 1}] Title: ${r.title}\nURL: ${r.url}\nContent: ${r.snippet}\n`
        ).join('\n');

        // 4. Summarize search findings using Gemini reasoning
        let systemInstruction = `You are a researcher agent specializing in the ${track} track of ${city} real estate. 
Analyze the provided web search results and summarize the actual, factual, and verified real estate data.
Always extract exact source links, dates, builders, and prices.
Return a structured markdown list summarizing the findings. Keep it strictly factual, direct, and free of sales fluff.`;

        if (track === 'projects') {
          systemInstruction += ` Focus on priority areas: ${config.priority_localities.join(', ')}. Format details with Project, Builder, Locality, Launch Date, Starting Price, Price per Sq.ft, Inventory.`;
        }

        const response = await callGemini({
          prompt: `Web search results for "${query}":\n\n${formattedSearchText}\n\nSummarize the key facts according to your instructions.`,
          systemInstruction,
          useSearch: false, // The provider already fetched search details, no need for second search grounding.
          model: 'gemini-2.5-flash'
        });
        
        const dataText = response.text;
        
        // 5. Cache the final summarized text
        await cache.set(query, dataText);

        results[track].push({
          query,
          source: searchSource,
          data: dataText
        });
      }
    }

    eventBus.emitEvent('agent:completed', { 
      name: 'research', 
      data: { queriesExecuted, cacheHits } 
    });

    return results;
  } catch (err) {
    eventBus.emitEvent('agent:error', { name: 'research', error: err.message });
    throw err;
  }
}

export const researcherAgent = {
  id: "researcher",
  name: "Research Agent",
  description: "Executes parallel search tracks via pluggable Search Providers",
  executionOrder: 2,
  dependsOn: ["planner"],
  capabilities: ["web_search", "caching", "provider_abstraction"],
  tags: ["pipeline", "research"],
  handler: async (context) => {
    context.rawResearchData = await runResearcherAgent(context.db, context.queries, context.config);
  }
};

export default runResearcherAgent;
