import eventBus from '../core/eventBus.js';

export class MetricsCollector {
  constructor() {
    this.reset();
    this.bindEvents();
  }

  reset() {
    this.agents = {};
    this.search = {
      primaryProvider: "tavily",
      fallbackUsed: false,
      queriesExecuted: 0,
      cacheHits: 0,
      cacheMisses: 0,
      searchFailures: 0,
      retryCount: 0,
      apiTimeMs: 0
    };
    this.entities = {
      projectsExtracted: 0,
      projectsValidated: 0,
      projectsRejected: 0,
      marketUpdates: 0,
      infrastructureUpdates: 0,
      insightsGenerated: 0,
      duplicatesRemoved: 0,
      validationFailures: 0
    };
    this.errors = [];
  }

  bindEvents() {
    // 1. Agent Lifecycle Events
    eventBus.on('agent:start', ({ name }) => {
      this.agents[name] = {
        startTime: Date.now(),
        status: 'running',
        errorCount: 0
      };
    });

    eventBus.on('agent:completed', ({ name, data }) => {
      const record = this.agents[name];
      if (record) {
        record.endTime = Date.now();
        record.durationMs = record.endTime - record.startTime;
        record.status = 'success';
        
        // Dynamic stats parsing depending on agent completed payload
        if (name === 'research' && data) {
          this.search.queriesExecuted += data.queriesExecuted || 0;
          this.search.cacheHits += data.cacheHits || 0;
          this.search.cacheMisses += data.queriesExecuted || 0; 
        }
        if (name === 'verification' && data) {
          this.entities.projectsValidated += data.verifiedCount || 0;
          this.entities.projectsRejected += data.rejectedCount || 0;
          this.entities.validationFailures += data.rejectedCount || 0;
        }
        if (name === 'insight' && data) {
          this.entities.insightsGenerated += data.count || 0;
        }
      }
    });

    eventBus.on('agent:error', ({ name, error }) => {
      const record = this.agents[name];
      if (record) {
        record.endTime = Date.now();
        record.durationMs = record.endTime - record.startTime;
        record.status = 'failed';
        record.errorCount++;
      }
      this.errors.push({
        agent: name,
        severity: 'error',
        message: error,
        timestamp: new Date().toISOString()
      });
    });

    // 2. API / Provider Events
    eventBus.on('api:success', ({ useSearch }) => {
      if (useSearch) {
        this.search.queriesExecuted++;
      }
    });

    eventBus.on('api:error', ({ attempt, error, model }) => {
      this.search.retryCount++;
      this.errors.push({
        agent: 'api_client',
        severity: 'warning',
        message: `API Call failed (Attempt ${attempt}): ${error} for model ${model}`,
        timestamp: new Date().toISOString()
      });
    });

    // Custom custom event triggers for granular search tracking
    eventBus.on('search:query', ({ provider }) => {
      this.search.primaryProvider = provider;
    });

    eventBus.on('search:fallback', ({ query, error }) => {
      this.search.fallbackUsed = true;
      this.search.searchFailures++;
      this.errors.push({
        agent: 'researcher',
        severity: 'warning',
        message: `Fallback triggered for query "${query}". Primary failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    });

    eventBus.on('cache:hit', () => {
      this.search.cacheHits++;
    });

    eventBus.on('cache:miss', () => {
      this.search.cacheMisses++;
    });

    eventBus.on('entity:resolved', ({ count }) => {
      this.entities.projectsExtracted += count;
    });

    eventBus.on('entity:merged', ({ count }) => {
      this.entities.duplicatesRemoved += count;
    });
  }
}

export const metricsCollector = new MetricsCollector();
export default metricsCollector;
