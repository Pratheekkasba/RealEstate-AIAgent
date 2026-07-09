import { db } from './firebase.js';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const dataService = {
  /**
   * Fetches the latest published brief ("today").
   */
  async getTodayBrief() {
    try {
      const docRef = doc(db, 'daily_briefs', 'today');
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error('Error fetching today brief:', err);
      throw err;
    }
  },

  /**
   * Fetches historical briefs (ordered by date desc).
   */
  async getBriefArchive(limitCount = 14) {
    try {
      const collRef = collection(db, 'daily_briefs');
      const q = query(collRef, orderBy('date', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(item => item.date); // Only docs that have a real date field
    } catch (err) {
      console.error('Error fetching brief archive:', err);
      return [];
    }
  },

  /**
   * Fetches the latest system run telemetry document.
   */
  async getLatestRun() {
    try {
      const docRef = doc(db, 'system_runs', 'latest');
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error('Error fetching latest system run:', err);
      return null;
    }
  },

  /**
   * Fetches a list of recent system execution runs.
   */
  async getRecentRuns(limitCount = 10) {
    try {
      const collRef = collection(db, 'system_runs');
      const q = query(collRef, orderBy('startTime', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(item => item.runId && item.runId !== 'latest');
    } catch (err) {
      console.error('Error fetching recent system runs:', err);
      return [];
    }
  }
};

export default dataService;
