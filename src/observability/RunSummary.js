import Telemetry from './Telemetry.js';
import HealthReporter from './HealthReporter.js';
import runTracker from './RunTracker.js';
import eventBus from '../core/eventBus.js';

export class RunSummary {
  /**
   * Package telemetry metrics and save them to the Firestore database.
   * @param {Object} db - Firestore database instance
   * @param {Object} qualityGate - Final quality metrics evaluated
   * @returns {Promise<Object>} Compiled telemetry report
   */
  static async publish(db, qualityGate) {
    const healthSummary = HealthReporter.evaluate();
    const runReport = Telemetry.compile(qualityGate, healthSummary);

    try {
      console.log(`[Telemetry] Saving execution run summary for ${runTracker.runId} to Firestore...`);
      
      eventBus.emitEvent('db:start', { op: 'save-telemetry' });
      await db.collection('system_runs').doc(runTracker.runId).set(runReport);
      await db.collection('system_runs').doc('latest').set(runReport);
      eventBus.emitEvent('db:success', { op: 'save-telemetry', writes: 2 });
      
      console.log(`[Telemetry] Telemetry run report successfully saved! Health Status: ${healthSummary.status.toUpperCase()}`);
    } catch (err) {
      console.warn(`[Telemetry] Failed to save run summary to database: ${err.message}`);
      eventBus.emitEvent('db:error', { op: 'save-telemetry', error: err.message });
    }

    return runReport;
  }
}

export default RunSummary;
