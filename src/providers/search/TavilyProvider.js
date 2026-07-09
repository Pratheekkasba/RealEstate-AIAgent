import SearchProvider from './SearchProvider.js';
import dotenv from 'dotenv';

dotenv.config();

export class TavilyProvider extends SearchProvider {
  async search(query) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("Tavily API key is missing from environment.");
    }

    console.log(`[Tavily Search Provider] Querying: "${query}"`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'advanced',
        max_results: 5
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    // Normalize response
    return results.map(r => {
      let sourceName = "Tavily Search";
      try {
        if (r.url) {
          sourceName = new URL(r.url).hostname;
        }
      } catch (err) {
        // Safe fallback
      }

      return {
        title: r.title || "Tavily Search Result",
        url: r.url || "",
        snippet: r.content || "",
        publishedDate: r.published_date || null,
        source: sourceName,
        provider: "tavily",
        confidence: r.score !== undefined ? parseFloat(r.score) : null
      };
    });
  }
}

export default TavilyProvider;
