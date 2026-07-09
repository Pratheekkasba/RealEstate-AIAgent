import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDoK2889_WLdY_zYbcyW0lSmmOCA5_3X60",
  authDomain: "saas-final-9e50f.firebaseapp.com",
  projectId: "saas-final-9e50f",
  storageBucket: "saas-final-9e50f.firebasestorage.app",
  messagingSenderId: "61811913807",
  appId: "1:61811913807:web:fc666ef408e95c93e2a63a",
  measurementId: "G-W6DKWC0B9R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default db;
