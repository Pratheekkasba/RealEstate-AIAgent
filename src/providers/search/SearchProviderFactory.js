import GeminiProvider from './GeminiProvider.js';
import TavilyProvider from './TavilyProvider.js';

export class SearchProviderFactory {
  /**
   * Instantiates a search provider.
   * @param {string} name
   * @returns {SearchProvider}
   */
  static getProvider(name) {
    if (!name) {
      throw new Error("No search provider specified.");
    }
    
    switch (name.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      case 'tavily':
        return new TavilyProvider();
      default:
        throw new Error(`Unsupported search provider: "${name}". Enabled providers are 'gemini', 'tavily'.`);
    }
  }
}

export default SearchProviderFactory;
