import callGemini from '../utils/apiClient.js';
import eventBus from '../core/eventBus.js';

export async function runRecommendationsAgent(verifiedData, insights, config) {
  eventBus.emitEvent('agent:start', { name: 'recommendations' });

  const city = config.city || 'Pune';

  const prompt = `
You are the Broker Recommendation Agent in a Real Estate Intelligence Engine.
Analyze the following verified daily data and insights for "${city}" and compile actionable broker recommendations.

Verified Projects:
${JSON.stringify(verifiedData.projects)}

Verified News & Infrastructure:
${JSON.stringify(verifiedData.news)}

Temporal Insights (Today vs Yesterday):
${JSON.stringify(insights)}

Generate:
1. **Today's Opportunity**: An actionable market opportunity based on infrastructure updates or high demand zones (e.g. metro expansion, pricing advantage in Wakad/Kharadi). Highlight which localities are hot.
2. **Talking Points**: 5 concise, plain-English talking points a broker can use in direct conversations with home buyers today. Do not sound technical or use marketing jargon. Make them look professional yet conversational.
3. **Caution Items**: Any items requiring caution, such as conflicting reports, missing details, or highly volatile prices.

Format the output strictly as JSON matching this schema:
{
  "opportunity": {
    "headline": "Opportunity headline",
    "description": "Short explanation in plain language"
  },
  "talkingPoints": [
    "Talking point 1",
    "Talking point 2",
    "Talking point 3",
    "Talking point 4",
    "Talking point 5"
  ],
  "cautionItems": [
    "Caution item 1",
    "Caution item 2"
  ]
}
`;

  try {
    const response = await callGemini({
      prompt,
      systemInstruction: 'You are an analyst writing for a busy broker. Do not use jargon or marketing filler. Output only JSON matching the schema.',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          opportunity: {
            type: 'OBJECT',
            properties: {
              headline: { type: 'STRING' },
              description: { type: 'STRING' }
            },
            required: ['headline', 'description']
          },
          talkingPoints: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          cautionItems: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
        required: ['opportunity', 'talkingPoints', 'cautionItems']
      }
    });

    const result = JSON.parse(response.text);
    eventBus.emitEvent('agent:completed', { name: 'recommendations', data: result });
    return result;
  } catch (err) {
    eventBus.emitEvent('agent:error', { name: 'recommendations', error: err.message });
    // Safe fallbacks
    return {
      opportunity: {
        headline: `High demand around IT corridors in ${city}`,
        description: `Connectivity expansions are boosting buyer sentiment. Focus discussions on peripheral suburbs with upcoming transit access.`
      },
      talkingPoints: [
        `Interest rates remain stable today, making it a good time to lock in long-term home loan rates.`,
        `New premium launches in active IT hubs offer strong modern lifestyle amenities.`,
        `Metro expansions are significantly reducing commute times for peripheral residents.`,
        `Integrated townships are attracting more family buyers compared to standalone projects.`,
        `RERA-registered projects continue to offer the highest peace of mind for buyers.`
      ],
      cautionItems: [
        `Verify launching prices directly from RERA sheets due to minor variations on portal listings.`,
        `Infrastructure expansion deadlines can occasionally shift, so advise buyers accordingly.`
      ]
    };
  }
}

export default runRecommendationsAgent;
