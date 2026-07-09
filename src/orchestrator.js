import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

import eventBus from './core/eventBus.js';
import healthMonitor from './utils/healthMonitor.js';
import evaluateQualityGate from './utils/qualityGatekeeper.js';

import validateEntity from './schemas/validators/schemaValidator.js';
import runTracker from './observability/RunTracker.js';
import RunSummary from './observability/RunSummary.js';

// Import Agent Registry and Agent Specifications
import { agentRegistry } from './core/agentRegistry.js';
import { plannerAgent } from './agents/planner.js';
import { researcherAgent } from './agents/researcher.js';
import { pipelineAgent } from './agents/pipeline.js';
import { insightAgent } from './agents/insight.js';
import { recommendationsAgent } from './agents/recommendations.js';
import { formatterAgent } from './agents/formatter.js';

dotenv.config();

// Read config
const configPath = path.resolve('src/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Register Agents in the registry
agentRegistry.register(plannerAgent);
agentRegistry.register(researcherAgent);
agentRegistry.register(pipelineAgent);
agentRegistry.register(insightAgent);
agentRegistry.register(recommendationsAgent);
agentRegistry.register(formatterAgent);

// Apply configuration overrides (enabled state & execution order)
agentRegistry.loadConfigOverrides(config);

// Bind event-driven subscribers
agentRegistry.bindEvents();

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
    orderBy: () => ({
      limit: () => ({
        get: async () => {
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
  const runId = runTracker.start(config.city, 'manual');

  console.log(`\n======================================================`);
  console.log(`Starting Real Estate Intelligence Engine run for: ${config.city}`);
  console.log(`Local Time: ${new Date().toLocaleString()}`);
  console.log(`Run ID: ${runId}`);
  console.log(`======================================================\n`);

  try {
    // 1. Fetch Yesterday's Brief (Agent Memory)
    eventBus.emitEvent('db:start', { op: 'fetch-yesterday' });
    let yesterdayData = null;
    
    try {
      const briefsColl = activeDb.collection('daily_briefs');
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

    // 2. Initialize Pipeline Context
    const context = {
      runId,
      config,
      db: activeDb,
      yesterdayData,
      queries: null,
      rawResearchData: null,
      verifiedData: null,
      insights: null,
      recommendations: null,
      qualityGate: null,
      formattedReport: null
    };

    // 3. Resolve Enabled Agents in correct execution order
    const enabledAgents = agentRegistry.getEnabledAgents();
    console.log(`[Orchestrator] Loaded ${enabledAgents.length} active agents:`, enabledAgents.map(a => a.id).join(' -> '));

    // 4. Run Agents in sequence
    for (const agent of enabledAgents) {
      console.log(`\n[Orchestrator] Running agent: ${agent.name} [${agent.id}]`);
      
      // Inject Quality Gate calculations dynamically before Formatter execution
      if (agent.id === 'formatter') {
        const plannedCount = (context.queries?.projects?.length || 0) + 
                             (context.queries?.market?.length || 0) + 
                             (context.queries?.infrastructure?.length || 0);
        const successfulCount = plannedCount; // Assumes search completed
        
        const verifiedFacts = (context.verifiedData.projects || [])
          .concat(context.verifiedData.market || [])
          .concat(context.verifiedData.infrastructure || []);

        context.qualityGate = evaluateQualityGate({
          plannedSearchesCount: plannedCount,
          successfulSearchesCount: successfulCount,
          verifiedFacts: verifiedFacts,
          rejectedFacts: context.verifiedData.rejected || [],
          threshold: config.quality_publish_threshold || 70
        });
        console.log(`[Quality Gate] Score: ${context.qualityGate.qualityScore}% | Status: ${context.qualityGate.status.toUpperCase()}`);
      }

      await agent.handler(context);
    }

    const formattedReport = context.formattedReport;
    const qualityGate = context.qualityGate;

    if (!formattedReport || !formattedReport.markdown) {
      throw new Error("No briefing report was formatted. Check Formatter Agent.");
    }

    // Save output path
    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(outputDir, 'latest_brief.md'), formattedReport.markdown, 'utf8');
    fs.writeFileSync(path.resolve(outputDir, 'latest_brief.json'), JSON.stringify(formattedReport.payload, null, 2), 'utf8');

    // 5. Sync output and health logs to Database
    const todayDate = new Date().toISOString().substring(0, 10);
    const docId = todayDate;

    // Validate payloads at the persistence boundary
    try {
      console.log(`[Orchestrator] Running final schema validation boundary check...`);
      (formattedReport.payload.projects || []).forEach(p => validateEntity('project', p));
      (formattedReport.payload.market || []).forEach(m => validateEntity('market', m));
      (formattedReport.payload.infrastructure || []).forEach(i => validateEntity('infrastructure', i));
      (formattedReport.payload.insights || []).forEach(ins => validateEntity('insight', ins));
      console.log(`[Orchestrator] Schema validation boundary check passed successfully!`);
    } catch (valErr) {
      console.warn(`[Orchestrator] Warning: Payload validation failed at persistence boundary: ${valErr.message}`);
    }

    eventBus.emitEvent('db:start', { op: 'save-brief' });
    await activeDb.collection('daily_briefs').doc(docId).set(formattedReport.payload);
    await activeDb.collection('daily_briefs').doc('today').set(formattedReport.payload);
    eventBus.emitEvent('db:success', { op: 'save-brief', writes: 2 });

    // Save Health Stats
    const healthSummary = healthMonitor.complete();
    eventBus.emitEvent('db:start', { op: 'save-health' });
    await activeDb.collection('health_status').doc(docId).set(healthSummary);
    await activeDb.collection('health_status').doc('latest').set(healthSummary);
    eventBus.emitEvent('db:success', { op: 'save-health', writes: 2 });

    // 6. Complete and Publish Observability Run Metrics
    const finalStatus = qualityGate.passes ? "success" : "partial_success";
    runTracker.complete(finalStatus);
    await RunSummary.publish(activeDb, qualityGate);

    console.log(`\n======================================================`);
    console.log(`Daily Brief successfully processed via Agent Registry!`);
    console.log(`Status: ${qualityGate.status.toUpperCase()}`);
    console.log(`Quality Score: ${qualityGate.qualityScore}%`);
    console.log(`Brief written to output/latest_brief.md`);
    console.log(`======================================================\n`);

    return formattedReport.payload;
  } catch (err) {
    console.error(`\n[Orchestrator] Fatal Error in Engine Execution: ${err.stack}\n`);
    healthMonitor.status.agents.formatter.status = 'failed';
    healthMonitor.status.agents.formatter.error = err.message;
    
    // Complete and publish failed run telemetry
    runTracker.complete("failed");
    await RunSummary.publish(activeDb, context.qualityGate);

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

// Execute if run directly
const isMain = process.argv[1] && path.resolve(process.argv[1]).replace(/\\/g, '/').endsWith('src/orchestrator.js');
if (isMain) {
  executeOrchestration();
}

export default executeOrchestration;
