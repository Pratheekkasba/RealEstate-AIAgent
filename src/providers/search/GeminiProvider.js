import SearchProvider from './SearchProvider.js';
import { callGemini } from '../../utils/apiClient.js';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiProvider extends SearchProvider {
  async search(query) {
    console.log(`[Gemini Search Provider] Querying: "${query}"`);

    // Check if we are in Simulation Mode
    const apiKey = process.env.GEMINI_API_KEY;
    const isSimulationMode = !apiKey || apiKey.includes('YOUR_GEMINI_API_KEY');

    if (isSimulationMode) {
      console.log(`[Gemini Search Provider] [SIMULATION MODE] Returning mock search results.`);
      return [
        {
          title: `Simulated search result for: ${query}`,
          url: "https://simulated.realestate.gov.in",
          snippet: `This is simulated research content for the query: ${query}. Modern apartments and infrastructures are rising.`,
          publishedDate: new Date().toISOString(),
          source: "simulated.realestate.gov.in",
          provider: "gemini",
          confidence: 1.0
        }
      ];
    }

    // Perform query using Gemini Google Search tool
    const response = await callGemini({
      prompt: `Search for facts about: "${query}". Return the main facts.`,
      useSearch: true,
      model: 'gemini-2.5-flash'
    });

    const candidate = response.candidates && response.candidates[0];
    const groundingMetadata = candidate?.groundingMetadata || {};
    const groundingChunks = groundingMetadata.groundingChunks || [];

    if (groundingChunks.length === 0) {
      // Fallback if no specific chunks are returned
      return [{
        title: `Google Search: ${query}`,
        url: "https://www.google.com",
        snippet: response.text || "No details found.",
        publishedDate: null,
        source: "Google Search",
        provider: "gemini",
        confidence: 0.8
      }];
    }

    return groundingChunks.map((chunk, idx) => {
      const web = chunk.web || {};
      let sourceName = "Google Search";
      try {
        if (web.uri) {
          sourceName = new URL(web.uri).hostname;
        }
      } catch (err) {}

      return {
        title: web.title || `Google Search Chunk ${idx + 1}`,
        url: web.uri || "",
        snippet: web.title || "", 
        publishedDate: null,
        source: sourceName,
        provider: "gemini",
        confidence: 1.0
      };
    });
  }
}

export default GeminiProvider;
