import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const keyPath = path.resolve('firebase-key.json');
const briefPath = path.resolve('output/latest_brief.json');

if (!fs.existsSync(keyPath)) {
  console.error("Error: firebase-key.json not found in root directory.");
  process.exit(1);
}

if (!fs.existsSync(briefPath)) {
  console.error("Error: output/latest_brief.json not found. Run orchestrator first.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const briefPayload = JSON.parse(fs.readFileSync(briefPath, 'utf8'));

// Convert the timestamp string back to a Date object for Firestore
briefPayload.timestamp = new Date(briefPayload.timestamp);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function upload() {
  try {
    const todayDate = new Date().toISOString().substring(0, 10);
    console.log(`[Upload] Uploading brief to document: ${todayDate} and 'today'...`);
    
    await db.collection('daily_briefs').doc(todayDate).set(briefPayload);
    await db.collection('daily_briefs').doc('today').set(briefPayload);
    
    console.log("[Upload] Success! The brief has been written to the online Firestore database.");
    process.exit(0);
  } catch (err) {
    console.error("[Upload] Error writing to Firestore:", err);
    process.exit(1);
  }
}

upload();
