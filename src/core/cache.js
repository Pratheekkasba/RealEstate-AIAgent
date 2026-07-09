import admin from 'firebase-admin';

export class SearchCache {
  constructor(db, expiryHours = 12) {
    this.db = db;
    this.expiryHours = expiryHours;
    this.collectionName = 'search_cache';
  }

  // Get cached result if it exists and is fresh
  async get(queryText) {
    try {
      const docId = this._getQueryDocId(queryText);
      const docRef = this.db.collection(this.collectionName).doc(docId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      const ageMs = Date.now() - data.timestamp.toDate().getTime();
      const expiryMs = this.expiryHours * 60 * 60 * 1000;

      if (ageMs > expiryMs) {
        // Cache expired
        return null;
      }

      return data.result;
    } catch (err) {
      console.warn(`[Cache] Error reading cache: ${err.message}`);
      return null; // Fail-silent and run live search
    }
  }

  // Save query result to cache
  async set(queryText, result) {
    try {
      const docId = this._getQueryDocId(queryText);
      const docRef = this.db.collection(this.collectionName).doc(docId);

      await docRef.set({
        query: queryText,
        result: result,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.warn(`[Cache] Error writing cache: ${err.message}`);
    }
  }

  // Helper to generate a clean Firestore document ID from query
  _getQueryDocId(queryText) {
    // Generate simple alphanumeric key
    return Buffer.from(queryText.toLowerCase().trim()).toString('base64').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
  }
}

export default SearchCache;
