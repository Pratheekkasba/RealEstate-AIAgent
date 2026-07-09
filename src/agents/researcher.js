import callGemini, { searchTavily } from '../utils/apiClient.js';
import SearchCache from '../core/cache.js';
import eventBus from '../core/eventBus.js';

export async function runResearcherAgent(db, queries, config) {
  eventBus.emitEvent('agent:start', { name: 'research' });

  const cache = new SearchCache(db, config.cache_expiry_hours || 12);
  const city = config.city || 'Pune';
  
  let queriesExecuted = 0;
  let cacheHits = 0;

  const results = {
    projects: [],
    market: [],
    infrastructure: []
  };

  const tracks = ['projects', 'market', 'infrastructure'];

  try {
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

        // 2. Perform Research (Try Tavily first, fallback to Gemini Search Grounding)
        queriesExecuted++;
        let dataText = '';
        let searchSource = 'live_search';
        
        let systemInstruction = `You are a researcher agent specializing in the ${track} track of ${city} real estate. 
Analyze the provided web search results and summarize the actual, factual, and verified real estate data.
Always extract exact source links, dates, builders, and prices.
Return a structured markdown list summarizing the findings. Keep it strictly factual, direct, and free of sales fluff.`;

        if (track === 'projects') {
          systemInstruction += ` Focus on priority areas: ${config.priority_localities.join(', ')}. Format details with Project, Builder, Locality, Launch Date, Starting Price, Price per Sq.ft, Inventory.`;
        }

        try {
          // Attempt Tavily search
          const searchResults = await searchTavily(query);
          searchSource = 'tavily_search';
          
          // Feed the structured search results to Gemini for RAG summarization
          const response = await callGemini({
            prompt: `Web search results for "${query}":\n\n${searchResults}\n\nSummarize the key facts according to your instructions.`,
            systemInstruction,
            useSearch: false, // Tavily already searched, no need for second search grounding
            model: 'gemini-2.5-flash'
          });
          
          dataText = response.text;
        } catch (tavilyError) {
          console.warn(`[Researcher] Tavily search failed for "${query}": ${tavilyError.message}. Falling back to Gemini Google Search Grounding.`);
          
          // Fallback to Gemini Google Search Grounding
          const response = await callGemini({
            prompt: `Run a live search for: "${query}". Provide the latest details.`,
            systemInstruction: systemInstruction.replace('Analyze the provided web search results', 'Use the Google Search tool'),
            useSearch: true,
            model: 'gemini-2.5-flash'
          });
          
          dataText = response.text;
        }
        
        // 3. Cache the final summarized text
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
  description: "Executes parallel search tracks via Tavily & Gemini Search",
  executionOrder: 2,
  dependsOn: ["planner"],
  capabilities: ["web_search", "caching"],
  tags: ["pipeline", "research"],
  handler: async (context) => {
    context.rawResearchData = await runResearcherAgent(context.db, context.queries, context.config);
  }
};

export default runResearcherAgent;
