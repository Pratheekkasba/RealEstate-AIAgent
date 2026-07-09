import callGemini from '../utils/apiClient.js';
import eventBus from '../core/eventBus.js';

export async function runPlannerAgent(config) {
  eventBus.emitEvent('agent:start', { name: 'planner' });

  const { city, priority_localities } = config;

  const prompt = `
You are the Search Planner Agent in a Real Estate Intelligence Engine.
Your goal is to plan targeted daily search queries for the city of "${city}".
Priority localities to monitor: ${priority_localities.join(', ')}.

Generate exactly 6 highly optimized search queries split into three tracks:
1. **Projects Track** (2 queries): Finding new project launches, builder announcements, RERA updates.
2. **Market Track** (2 queries): Finding RBI announcements, interest rates, stamp duty, policy changes affecting the city's housing.
3. **Infrastructure Track** (2 queries): Finding metro expansions, ring roads, highways, and connectivity updates in the city.

For the city of "${city}", consider local developers (e.g. Kolte Patil, Lodha, Godrej, Vilas Javdekar if Pune; Prestige, Sobha if Bengaluru, etc.) and major infrastructure projects (e.g. Pune Metro, Ring Road).

Return the response in JSON format matching this schema:
{
  "queries": {
    "projects": ["query 1", "query 2"],
    "market": ["query 1", "query 2"],
    "infrastructure": ["query 1", "query 2"]
  }
}
`;

  try {
    const response = await callGemini({
      prompt,
      systemInstruction: 'You are an expert real estate research analyst. Generate only valid JSON output matching the requested schema.',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          queries: {
            type: 'OBJECT',
            properties: {
              projects: { type: 'ARRAY', items: { type: 'STRING' } },
              market: { type: 'ARRAY', items: { type: 'STRING' } },
              infrastructure: { type: 'ARRAY', items: { type: 'STRING' } }
            },
            required: ['projects', 'market', 'infrastructure']
          }
        },
        required: ['queries']
      }
    });

    const result = JSON.parse(response.text);
    eventBus.emitEvent('agent:completed', { name: 'planner', data: result });
    return result.queries;
  } catch (err) {
    eventBus.emitEvent('agent:error', { name: 'planner', error: err.message });
    // Safe fallback queries if Planner fails
    return {
      projects: [
        `new residential projects launched in ${city} 2026`,
        `RERA registered projects launches ${city} builder announcements`
      ],
      market: [
        `RBI interest rates home loans stamp duty notifications ${city}`,
        `housing demand buyer sentiment real estate trends ${city}`
      ],
      infrastructure: [
        `metro corridor expansion highway road developments ${city} connectivity`,
        `infrastructure projects updates affecting real estate in ${city}`
      ]
    };
  }
}

export default runPlannerAgent;
