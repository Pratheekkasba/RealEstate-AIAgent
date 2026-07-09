import eventBus from '../core/eventBus.js';

export class EngineHealthMonitor {
  constructor() {
    this.logs = [];
    this.status = {
      startTime: new Date().toISOString(),
      endTime: null,
      durationMs: 0,
      agents: {
        planner: { status: 'idle', durationMs: 0, error: null },
        research: { status: 'idle', durationMs: 0, queriesExecuted: 0, cacheHits: 0, error: null },
        verification: { status: 'idle', durationMs: 0, verifiedClaimsCount: 0, rejectedClaimsCount: 0, error: null },
        insight: { status: 'idle', durationMs: 0, error: null },
        recommendations: { status: 'idle', durationMs: 0, error: null },
        formatter: { status: 'idle', durationMs: 0, error: null }
      },
      api: {
        callsCount: 0,
        errorsCount: 0,
        successfulCallsCount: 0
      },
      db: {
        status: 'idle',
        reads: 0,
        writes: 0,
        error: null
      }
    };

    this._initializeListeners();
  }

  _initializeListeners() {
    // Listen to agent events
    eventBus.on('agent:start', ({ name }) => {
      if (this.status.agents[name]) {
        this.status.agents[name].status = 'running';
        this.status.agents[name].startTime = Date.now();
        this._addLog(`Agent [${name}] started.`);
      }
    });

    eventBus.on('agent:completed', ({ name, data = {} }) => {
      if (this.status.agents[name]) {
        const agent = this.status.agents[name];
        agent.status = 'completed';
        agent.durationMs = Date.now() - agent.startTime;
        
        // Merge specific agent metrics
        if (name === 'research') {
          agent.queriesExecuted = data.queriesExecuted || 0;
          agent.cacheHits = data.cacheHits || 0;
        } else if (name === 'verification') {
          agent.verifiedClaimsCount = data.verifiedCount || 0;
          agent.rejectedClaimsCount = data.rejectedCount || 0;
        }
        
        this._addLog(`Agent [${name}] completed in ${agent.durationMs}ms.`);
      }
    });

    eventBus.on('agent:error', ({ name, error }) => {
      if (this.status.agents[name]) {
        this.status.agents[name].status = 'failed';
        this.status.agents[name].error = error;
        this._addLog(`Agent [${name}] failed: ${error}`);
      }
    });

    // Listen to API calls
    eventBus.on('api:success', () => {
      this.status.api.callsCount++;
      this.status.api.successfulCallsCount++;
    });

    eventBus.on('api:error', ({ error }) => {
      this.status.api.callsCount++;
      this.status.api.errorsCount++;
      this._addLog(`API Call Error: ${error}`);
    });

    // Listen to database events
    eventBus.on('db:start', ({ op }) => {
      this.status.db.status = 'writing';
      this._addLog(`Database operation [${op}] started.`);
    });

    eventBus.on('db:success', ({ op, reads = 0, writes = 0 }) => {
      this.status.db.status = 'success';
      this.status.db.reads += reads;
      this.status.db.writes += writes;
      this._addLog(`Database operation [${op}] completed successfully (Reads: ${reads}, Writes: ${writes}).`);
    });

    eventBus.on('db:error', ({ op, error }) => {
      this.status.db.status = 'failed';
      this.status.db.error = error;
      this._addLog(`Database operation [${op}] failed: ${error}`);
    });
  }

  _addLog(message) {
    const logItem = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(logItem);
    // console.log(logItem); // print to stdout for GitHub Actions logs
  }

  complete() {
    this.status.endTime = new Date().toISOString();
    this.status.durationMs = Date.now() - new Date(this.status.startTime).getTime();
    this._addLog(`Engine run completed in ${this.status.durationMs}ms.`);
    return {
      metrics: this.status,
      logs: this.logs
    };
  }
}

export const healthMonitor = new EngineHealthMonitor();
export default healthMonitor;
