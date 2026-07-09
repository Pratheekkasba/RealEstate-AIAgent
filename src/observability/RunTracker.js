import crypto from 'crypto';

export class RunTracker {
  constructor() {
    this.runId = "";
    this.city = "";
    this.triggerSource = "manual";
    this.startTime = null;
    this.endTime = null;
    this.status = "success"; // "success" | "partial_success" | "failed"
    this.engineVersion = "1.1.0";
    this.schemaVersion = "1.0.0";
  }

  /**
   * Initializes a new tracking run.
   */
  start(city, triggerSource = "manual") {
    const timestampStr = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];
    const randSuffix = crypto.randomBytes(3).toString('hex');
    
    this.runId = `run_${timestampStr}_${randSuffix}`;
    this.city = city;
    this.triggerSource = triggerSource;
    this.startTime = new Date().toISOString();
    this.endTime = null;
    this.status = "success";

    console.log(`[Run Tracker] Starting execution run: ${this.runId}`);
    return this.runId;
  }

  /**
   * Completes the current tracking run.
   */
  complete(status = "success") {
    this.endTime = new Date().toISOString();
    this.status = status;
    console.log(`[Run Tracker] Completed execution run: ${this.runId} | Status: ${status}`);
  }

  getDurationMs() {
    if (!this.startTime) return 0;
    const end = this.endTime ? new Date(this.endTime) : new Date();
    return end.getTime() - new Date(this.startTime).getTime();
  }
}

export const runTracker = new RunTracker();
export default runTracker;
