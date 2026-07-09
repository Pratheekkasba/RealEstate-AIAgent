import { EventEmitter } from 'events';

class EngineEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase listener limits if many agents subscribe
    this.setMaxListeners(50);
  }

  // Helper to publish events with standard logging/debugging
  emitEvent(eventName, data = {}) {
    // console.log(`[EventBus] EMIT: ${eventName}`, Object.keys(data));
    this.emit(eventName, data);
  }
}

export const eventBus = new EngineEventBus();
export default eventBus;
