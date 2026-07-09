import callGemini from '../utils/apiClient.js';
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

        // 2. Perform Live Google Search Grounding request
        queriesExecuted++;
        
        let systemInstruction = `You are a researcher agent specializing in the ${track} track of ${city} real estate. 
Use the Google Search tool to find actual, factual, and verified real estate data.
Always extract exact source links, dates, builders, and prices.
Return a structured markdown list summarizing the findings. Keep it strictly factual, direct, and free of sales fluff.`;

        if (track === 'projects') {
          systemInstruction += ` Focus on priority areas: ${config.priority_localities.join(', ')}. Format details with Project, Builder, Locality, Launch Date, Starting Price, Price per Sq.ft, Inventory.`;
        }

        const response = await callGemini({
          prompt: `Run a live search for: "${query}". Provide the latest details.`,
          systemInstruction,
          useSearch: true,
          model: 'gemini-2.5-flash' // Flash is ideal for fast search retrieval
        });

        const dataText = response.text;
        
        // 3. Cache the live search result
        await cache.set(query, dataText);

        results[track].push({
          query,
          source: 'live_search',
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

export default runResearcherAgent;
