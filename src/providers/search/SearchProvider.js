/**
 * Abstract Base Class for Search Providers
 */
export class SearchProvider {
  /**
   * Run a search query.
   * @param {string} query
   * @returns {Promise<NormalizedSearchResult[]>}
   */
  async search(query) {
    throw new Error("Method 'search(query)' must be implemented by concrete provider.");
  }
}

/**
 * @typedef {Object} NormalizedSearchResult
 * @property {string} title
 * @property {string} url
 * @property {string} snippet
 * @property {string|null} publishedDate
 * @property {string} source
 * @property {string} provider
 * @property {number|null} confidence
 */

export default SearchProvider;
