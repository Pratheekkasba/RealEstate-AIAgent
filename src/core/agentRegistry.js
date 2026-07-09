import eventBus from './eventBus.js';

export class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }

  /**
   * Registers a new agent to the system.
   */
  register(agent) {
    if (!agent.id) {
      throw new Error("Cannot register agent: missing unique 'id'.");
    }
    if (typeof agent.handler !== 'function') {
      throw new Error(`Cannot register agent [${agent.id}]: 'handler' must be a function.`);
    }

    this.agents.set(agent.id, {
      id: agent.id,
      name: agent.name || agent.id,
      description: agent.description || "",
      enabled: agent.enabled !== undefined ? agent.enabled : true,
      executionOrder: agent.executionOrder || 100,
      dependsOn: agent.dependsOn || [],
      subscribedEvents: agent.subscribedEvents || [],
      emittedEvents: agent.emittedEvents || [],
      capabilities: agent.capabilities || [],
      tags: agent.tags || [],
      handler: agent.handler
    });
  }

  /**
   * Retrieves an agent by its ID.
   */
  get(id) {
    return this.agents.get(id);
  }

  /**
   * Dynamically loads agent configurations (overrides) from config.json.
   * Maps legacy 'status' -> 'enabled' and 'order' -> 'executionOrder' keys.
   */
  loadConfigOverrides(config) {
    if (!config || !config.agents) return;

    for (const [id, agentConfig] of Object.entries(config.agents)) {
      const agent = this.agents.get(id);
      if (agent) {
        // Override enabled status (support boolean enabled and legacy status string)
        if (agentConfig.enabled !== undefined) {
          agent.enabled = !!agentConfig.enabled;
        } else if (agentConfig.status !== undefined) {
          agent.enabled = agentConfig.status === 'enabled';
        }

        // Override execution order
        if (agentConfig.order !== undefined) {
          agent.executionOrder = parseInt(agentConfig.order, 10);
        } else if (agentConfig.executionOrder !== undefined) {
          agent.executionOrder = parseInt(agentConfig.executionOrder, 10);
        }
      }
    }
  }

  /**
   * Binds event-driven agents automatically to the central Event Bus.
   */
  bindEvents() {
    for (const agent of this.agents.values()) {
      if (agent.enabled && agent.subscribedEvents.length > 0) {
        for (const eventName of agent.subscribedEvents) {
          eventBus.on(eventName, async (data) => {
            try {
              console.log(`[Event Bus] Triggering registered agent [${agent.id}] on event: ${eventName}`);
              await agent.handler(data);
            } catch (err) {
              console.error(`[Event Bus] Error in registered agent [${agent.id}] on event [${eventName}]:`, err);
            }
          });
        }
      }
    }
  }

  /**
   * Performs topological sort resolving dependsOn and executionOrder.
   * Returns a sorted list of enabled agents ready for execution.
   */
  getEnabledAgents() {
    const enabledList = Array.from(this.agents.values()).filter(a => a.enabled);
    
    // Sort primarily by executionOrder to set a baseline linear flow
    enabledList.sort((a, b) => a.executionOrder - b.executionOrder);

    const visited = new Set();
    const tempVisited = new Set();
    const sorted = [];

    const visit = (agent) => {
      if (visited.has(agent.id)) return;
      if (tempVisited.has(agent.id)) {
        throw new Error(`Circular dependency detected involving agent: ${agent.id}`);
      }

      tempVisited.add(agent.id);

      // Resolve dependencies first
      const dependencies = agent.dependsOn || [];
      for (const depId of dependencies) {
        const depAgent = enabledList.find(a => a.id === depId);
        if (depAgent) {
          visit(depAgent);
        }
      }

      tempVisited.delete(agent.id);
      visited.add(agent.id);
      sorted.push(agent);
    };

    for (const agent of enabledList) {
      if (!visited.has(agent.id)) {
        visit(agent);
      }
    }

    return sorted;
  }
}

export const agentRegistry = new AgentRegistry();
export default agentRegistry;
