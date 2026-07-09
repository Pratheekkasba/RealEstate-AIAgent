import runTracker from './RunTracker.js';
import metricsCollector from './MetricsCollector.js';

export class Telemetry {
  /**
   * Compiles the full observability Run Report.
   * @param {Object} qualityGate - The final quality metrics evaluated for the run
   * @param {Object} healthSummary - The computed run health summary
   * @returns {Object} Full run report payload matching schema requirements
   */
  static compile(qualityGate, healthSummary) {
    const agentRecords = {};
    for (const [id, record] of Object.entries(metricsCollector.agents)) {
      agentRecords[id] = {
        durationMs: record.durationMs || 0,
        status: record.status,
        errorCount: record.errorCount
      };
    }

    // Capture quality parameters
    const qualityMetrics = qualityGate ? {
      coverage: qualityGate.metrics.coverage,
      freshness: qualityGate.metrics.freshness,
      avgConfidence: qualityGate.metrics.confidenceScore / 100,
      overallScore: qualityGate.qualityScore,
      status: qualityGate.status
    } : {
      coverage: 100,
      freshness: 100,
      avgConfidence: 1.0,
      overallScore: 100,
      status: "published"
    };

    return {
      runId: runTracker.runId,
      engineVersion: runTracker.engineVersion,
      schemaVersion: runTracker.schemaVersion,
      startTime: runTracker.startTime,
      endTime: runTracker.endTime,
      totalDurationMs: runTracker.getDurationMs(),
      city: runTracker.city,
      triggerSource: runTracker.triggerSource,
      status: runTracker.status,
      health: healthSummary,
      agents: agentRecords,
      search: metricsCollector.search,
      entities: metricsCollector.entities,
      quality: qualityMetrics,
      errors: metricsCollector.errors
    };
  }
}

export default Telemetry;
