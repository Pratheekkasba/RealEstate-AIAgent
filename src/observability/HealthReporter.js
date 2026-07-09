import metricsCollector from './MetricsCollector.js';

export class HealthReporter {
  /**
   * Evaluates and returns the overall system health for the execution run.
   * @returns {Object} Health summary object containing { status, reason }
   */
  static evaluate() {
    // 1. Check for fatal agent failures
    const failedAgents = Object.entries(metricsCollector.agents)
      .filter(([_, record]) => record.status === 'failed')
      .map(([name, _]) => name);

    if (failedAgents.length > 0) {
      return {
        status: "critical",
        reason: `Fatal: Agent execution failed for: ${failedAgents.join(', ')}.`
      };
    }

    // 2. Check for warning conditions (Search fallbacks used, or high error count)
    if (metricsCollector.search.fallbackUsed) {
      return {
        status: "warning",
        reason: `Warning: Primary search provider failed. Fallback Google Search used successfully.`
      };
    }

    if (metricsCollector.errors.length > 0) {
      const apiErrors = metricsCollector.errors.filter(e => e.agent === 'api_client');
      if (apiErrors.length > 0) {
        return {
          status: "warning",
          reason: `Warning: Encountered ${apiErrors.length} API retry events during run. Recovered successfully.`
        };
      }
    }

    // 3. Otherwise Healthy
    return {
      status: "healthy",
      reason: "Healthy: Engine completed all execution tracks successfully."
    };
  }
}

export default HealthReporter;
