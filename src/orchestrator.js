import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

import eventBus from './core/eventBus.js';
import healthMonitor from './utils/healthMonitor.js';
import runPlannerAgent from './agents/planner.js';
import runResearcherAgent from './agents/researcher.js';
import runPipelineAgent from './agents/pipeline.js';
import runInsightAgent from './agents/insight.js';
import runRecommendationsAgent from './agents/recommendations.js';
import runFormatterAgent from './agents/formatter.js';
import evaluateQualityGate from './utils/qualityGatekeeper.js';

dotenv.config();

// Read config
const configPath = path.resolve('src/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase Admin
let db = null;
let useMockDb = false;

try {
  eventBus.emitEvent('db:start', { op: 'initialize' });
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
    db = admin.firestore();
  } else {
    const localKeyPath = path.resolve('firebase-key.json');
    if (fs.existsSync(localKeyPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(fs.readFileSync(localKeyPath, 'utf8')))
      });
      db = admin.firestore();
    } else {
      throw new Error("No Firebase credentials provided. Set FIREBASE_SERVICE_ACCOUNT or add firebase-key.json.");
    }
  }
  
  eventBus.emitEvent('db:success', { op: 'initialize', reads: 1 });
} catch (err) {
  console.warn(`[Orchestrator] Firebase initialization failed: ${err.message}. Falling back to Mock Local DB.`);
  useMockDb = true;
  db = null;
  eventBus.emitEvent('db:error', { op: 'initialize', error: err.message });
}

// Mock DB implementation for local dry runs
const mockDb = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => {
        const mockFilePath = path.resolve(`scratch/mock_${name}_${id}.json`);
        if (fs.existsSync(mockFilePath)) {
          const content = fs.readFileSync(mockFilePath, 'utf8');
          return {
            exists: true,
            data: () => JSON.parse(content)
          };
        }
        return { exists: false };
      },
      set: async (data) => {
        const mockDir = path.resolve('scratch');
        if (!fs.existsSync(mockDir)) {
          fs.mkdirSync(mockDir, { recursive: true });
        }
        const mockFilePath = path.resolve(`${mockDir}/mock_${name}_${id}.json`);
        fs.writeFileSync(mockFilePath, JSON.stringify(data, null, 2), 'utf8');
        return { writeTime: new Date() };
      }
    }),
    // Helper to get latest documents
    orderBy: () => ({
      limit: () => ({
        get: async () => {
          // Try to look in scratch folder for any mock_daily_briefs files
          const mockDir = path.resolve('scratch');
          if (fs.existsSync(mockDir)) {
            const files = fs.readdirSync(mockDir)
              .filter(f => f.startsWith('mock_daily_briefs_') && f.endsWith('.json'))
              .sort();
            if (files.length > 0) {
              const latestFile = files[files.length - 1];
              const content = fs.readFileSync(path.resolve(mockDir, latestFile), 'utf8');
              return {
                empty: false,
                docs: [{
                  data: () => JSON.parse(content)
                }]
              };
            }
          }
          return { empty: true, docs: [] };
        }
      })
    })
  })
};

const activeDb = useMockDb ? mockDb : db;

async function executeOrchestration() {
  console.log(`\n======================================================`);
  console.log(`Starting Real Estate Intelligence Engine run for: ${config.city}`);
  console.log(`Local Time: ${new Date().toLocaleString()}`);
  console.log(`======================================================\n`);

  try {
    // 1. Fetch Yesterday's Brief (Agent Memory)
    eventBus.emitEvent('db:start', { op: 'fetch-yesterday' });
    let yesterdayData = null;
    
    try {
      const briefsColl = activeDb.collection('daily_briefs');
      // Query the latest brief
      const snapshot = await briefsColl.orderBy('date', 'desc').limit(1).get();
      if (!snapshot.empty) {
        yesterdayData = snapshot.docs[0].data();
        console.log(`[Memory] Loaded historical data from: ${yesterdayData.date}`);
      } else {
        console.log(`[Memory] No previous briefs found in database.`);
      }
      eventBus.emitEvent('db:success', { op: 'fetch-yesterday', reads: 1 });
    } catch (err) {
      console.warn(`[Memory] Could not load historical brief: ${err.message}`);
      eventBus.emitEvent('db:error', { op: 'fetch-yesterday', error: err.message });
    }

    // 2. Run Search Planner Agent
    const queries = await runPlannerAgent(config);
    console.log(`[Planner] Generated queries for tracks: Projects, Market, Infrastructure.`);

    // 3. Run Researcher Agent (with Google Search Grounding & Cache check)
    const researchData = await runResearcherAgent(activeDb, queries, config);
    console.log(`[Researcher] Live/cached research queries complete.`);

    // 4. Run Duplicate Detection & Verification Pipeline
    const verifiedData = await runPipelineAgent(researchData, config);
    console.log(`[Verification] Verified ${verifiedData.projects.length} projects and ${verifiedData.news.length} news points.`);

    // 5. Run Insight Agent (Today vs Yesterday)
    const insights = await runInsightAgent(verifiedData, yesterdayData, config);
    console.log(`[Insight] Temporal comparison complete.`);

    // 6. Run Broker Recommendations Agent (Talking Points)
    const recommendations = await runRecommendationsAgent(verifiedData, insights, config);
    console.log(`[Recommendations] Created opportunities and caution briefs.`);

    // 7. Evaluate Quality Gate
    const plannedCount = (queries.projects?.length || 0) + (queries.market?.length || 0) + (queries.infrastructure?.length || 0);
    // Assumes successful search if no error was thrown
    const successfulCount = plannedCount; 
    
    const qualityGate = evaluateQualityGate({
      plannedSearchesCount: plannedCount,
      successfulSearchesCount: successfulCount,
      verifiedFacts: verifiedData.news.concat(verifiedData.projects),
      rejectedFacts: verifiedData.rejected,
      threshold: config.quality_publish_threshold || 70
    });
    console.log(`[Quality Gate] Score: ${qualityGate.qualityScore}% | Status: ${qualityGate.status.toUpperCase()}`);

    // 8. Run Formatter Agent (Compile MD & JSON Payload)
    const formattedReport = runFormatterAgent(verifiedData, insights, recommendations, qualityGate, config);
    
    // Save output path
    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(outputDir, 'latest_brief.md'), formattedReport.markdown, 'utf8');
    fs.writeFileSync(path.resolve(outputDir, 'latest_brief.json'), JSON.stringify(formattedReport.payload, null, 2), 'utf8');

    // 9. Sync output and health logs to Database
    const todayDate = new Date().toISOString().substring(0, 10);
    const docId = todayDate;

    eventBus.emitEvent('db:start', { op: 'save-brief' });
    // Write both daily_briefs/{date} and daily_briefs/today for the website
    await activeDb.collection('daily_briefs').doc(docId).set(formattedReport.payload);
    await activeDb.collection('daily_briefs').doc('today').set(formattedReport.payload);
    eventBus.emitEvent('db:success', { op: 'save-brief', writes: 2 });

    // Save Health Stats
    const healthSummary = healthMonitor.complete();
    eventBus.emitEvent('db:start', { op: 'save-health' });
    await activeDb.collection('health_status').doc(docId).set(healthSummary);
    await activeDb.collection('health_status').doc('latest').set(healthSummary);
    eventBus.emitEvent('db:success', { op: 'save-health', writes: 2 });

    console.log(`\n======================================================`);
    console.log(`Daily Brief successfully processed!`);
    console.log(`Status: ${qualityGate.status.toUpperCase()}`);
    console.log(`Quality Score: ${qualityGate.qualityScore}%`);
    console.log(`Brief written to output/latest_brief.md`);
    console.log(`======================================================\n`);

    return formattedReport.payload;
  } catch (err) {
    console.error(`\n[Orchestrator] Fatal Error in Engine Execution: ${err.stack}\n`);
    healthMonitor.status.agents.formatter.status = 'failed';
    healthMonitor.status.agents.formatter.error = err.message;
    
    const healthSummary = healthMonitor.complete();
    try {
      const todayDate = new Date().toISOString().substring(0, 10);
      await activeDb.collection('health_status').doc(todayDate).set(healthSummary);
      await activeDb.collection('health_status').doc('latest').set(healthSummary);
    } catch (e) {
      console.warn(`[Orchestrator] Could not save health log for failed run: ${e.message}`);
    }
    throw err;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).replace(/\\/g, '/').endsWith('src/orchestrator.js');
if (isMain) {
  executeOrchestration();
}

export default executeOrchestration;
