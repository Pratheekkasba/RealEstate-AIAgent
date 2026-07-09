import callGemini from '../utils/apiClient.js';
import { resolveProjectEntities } from '../utils/entityResolver.js';
import eventBus from '../core/eventBus.js';

export async function runPipelineAgent(rawResearchData, config) {
  eventBus.emitEvent('agent:start', { name: 'verification' });

  const city = config.city || 'Pune';
  
  // Combine all raw research texts into a single context block
  const projectsDataText = rawResearchData.projects.map(r => r.data).join('\n\n');
  const marketDataText = rawResearchData.market.map(r => r.data).join('\n\n');
  const infraDataText = rawResearchData.infrastructure.map(r => r.data).join('\n\n');

  try {
    // --- Step 1: Extract Entities ---
    const extractionPrompt = `
You are the Entity Extractor. Scan the following real estate research findings for "${city}" and extract a structured list of:
1. **Project Launches**: Any residential or commercial project launch, price update, or registration.
2. **Market & Infrastructure News**: Regulatory policies, interest rates, stamp duties, and metro/road developments.

Raw Project Research Data:
${projectsDataText}

Raw Market Research Data:
${marketDataText}

Raw Infrastructure Research Data:
${infraDataText}

Extract this data precisely. Do not make up any information.
Return the output in JSON format matching this schema:
{
  "projects": [
    {
      "projectName": "Name of project",
      "builder": "Builder name",
      "locality": "Locality/Area name",
      "startingPrice": "Starting price (e.g. 75 Lakhs, 1.2 Crore, or null)",
      "pricePerSqFt": "Price per square foot (numeric value or string like '8,500/sq.ft' or null)",
      "launchDate": "Date or month/year of launch",
      "previousPrice": "Previous price if mentioned",
      "priceMovement": "Up, Down, Stable, or Unknown",
      "inventoryStatus": "Inventory details (e.g. 50% sold, newly open, or null)",
      "source": "Name of publication or website domain",
      "sourceUrl": "URL if available, otherwise domain name"
    }
  ],
  "news": [
    {
      "headline": "Short descriptive headline of update",
      "category": "Policy, Interest Rates, Infrastructure, or Housing News",
      "summary": "1-2 sentence summary of what happened",
      "whyItMatters": "Why this is important for the market",
      "impactOnBuyers": "Direct impact on buyers",
      "impactLevel": "High, Medium, or Low",
      "source": "Source website or publisher",
      "sourceUrl": "URL if available"
    }
  ]
}
`;

    const extractionResponse = await callGemini({
      prompt: extractionPrompt,
      systemInstruction: 'You are an accurate data parser. Extract only verified data points. Output only JSON matching the schema.',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          projects: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                projectName: { type: 'STRING' },
                builder: { type: 'STRING' },
                locality: { type: 'STRING' },
                startingPrice: { type: 'STRING' },
                pricePerSqFt: { type: 'STRING' },
                launchDate: { type: 'STRING' },
                previousPrice: { type: 'STRING' },
                priceMovement: { type: 'STRING' },
                inventoryStatus: { type: 'STRING' },
                source: { type: 'STRING' },
                sourceUrl: { type: 'STRING' }
              },
              required: ['projectName', 'locality']
            }
          },
          news: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                headline: { type: 'STRING' },
                category: { type: 'STRING' },
                summary: { type: 'STRING' },
                whyItMatters: { type: 'STRING' },
                impactOnBuyers: { type: 'STRING' },
                impactLevel: { type: 'STRING' },
                source: { type: 'STRING' },
                sourceUrl: { type: 'STRING' }
              },
              required: ['headline', 'category', 'summary']
            }
          }
        },
        required: ['projects', 'news']
      }
    });

    const parsedData = JSON.parse(extractionResponse.text);

    // --- Step 2: Entity Resolution & Duplicate Merging (Local) ---
    const resolvedProjects = resolveProjectEntities(parsedData.projects);

    // --- Step 3: Run Verification Pipeline ---
    // Classify source tiers, calculate confidence levels, flag conflicts, and filter out fluff
    const verifiedFacts = [];
    const rejectedFacts = [];
    const conflicts = [];

    // Helper to categorize sources and determine base confidence
    const evaluateSource = (urlOrDomain) => {
      const src = (urlOrDomain || '').toLowerCase();
      if (src.includes('gov') || src.includes('rera') || src.includes('rbi') || src.includes('maharera')) {
        return { tier: 1, confidence: 'High' };
      }
      if (src.includes('99acres') || src.includes('magicbricks') || src.includes('housing.com') || src.includes('nobroker')) {
        return { tier: 2, confidence: 'Medium' };
      }
      if (src.includes('economic') || src.includes('financial') || src.includes('moneycontrol') || src.includes('timesofindia') || src.includes('express')) {
        return { tier: 3, confidence: 'Medium' };
      }
      return { tier: 4, confidence: 'Low' };
    };

    // Verify News/Policy claims
    for (const claim of parsedData.news) {
      const sourceEval = evaluateSource(claim.sourceUrl || claim.source);
      
      // Perform basic quality check: rejecting claims without a valid summary or headline
      if (!claim.headline || !claim.summary || claim.summary.length < 15) {
        rejectedFacts.push({ ...claim, reason: 'Incomplete or low-quality claim' });
        continue;
      }

      verifiedFacts.push({
        ...claim,
        confidence: sourceEval.confidence,
        tier: sourceEval.tier,
        fetchedDate: new Date().toISOString(),
        verifiedDate: new Date().toISOString()
      });
    }

    // Check for conflicts in project data
    const finalProjects = resolvedProjects.map(proj => {
      const projectSources = proj.sources || [];
      
      // If a project is reported by multiple sources with different price details, flag a conflict
      if (projectSources.length > 1 && proj.aliases.length > 1) {
        conflicts.push({
          type: 'Project Naming/Details Conflict',
          entity: proj.projectName,
          details: `Reported under multiple names: ${proj.aliases.join(', ')}. Sources: ${projectSources.join(', ')}`
        });
      }

      // Check for price ranges / details consistency
      if (proj.pricePerSqFt && (proj.pricePerSqFt.includes('-') || proj.pricePerSqFt.includes('to'))) {
        conflicts.push({
          type: 'Price Discrepancy Range',
          entity: proj.projectName,
          details: `Price ranges from ${proj.pricePerSqFt} instead of single static quote.`
        });
      }

      return {
        ...proj,
        fetchedDate: new Date().toISOString(),
        verifiedDate: new Date().toISOString()
      };
    });

    eventBus.emitEvent('agent:completed', { 
      name: 'verification', 
      data: { 
        verifiedCount: verifiedFacts.length + finalProjects.length, 
        rejectedCount: rejectedFacts.length 
      } 
    });

    return {
      projects: finalProjects,
      news: verifiedFacts,
      rejected: rejectedFacts,
      conflicts
    };
  } catch (err) {
    eventBus.emitEvent('agent:error', { name: 'verification', error: err.message });
    throw err;
  }
}

export default runPipelineAgent;
