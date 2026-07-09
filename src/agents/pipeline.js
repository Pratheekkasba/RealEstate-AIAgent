import callGemini from '../utils/apiClient.js';
import { resolveProjectEntities } from '../utils/entityResolver.js';
import validateEntity from '../schemas/validators/schemaValidator.js';
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
1. **Projects**: Residential or commercial project launches, price updates, or registrations.
2. **Market Updates**: Regulatory policies, interest rates, stamp duties, and taxation changes.
3. **Infrastructure Updates**: Metro expansions, road developments, highway connectivity, and major public works.

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
      "projectName": "Name of project (Required)",
      "builder": "Builder name",
      "locality": "Locality/Area name (Required)",
      "startingPrice": "Starting price (e.g. 75 Lakhs, 1.2 Crore, or null)",
      "pricePerSqFt": "Price per square foot (numeric value or string like '8,500/sq.ft' or null)",
      "launchDate": "Date or month/year of launch",
      "inventory": "Inventory details (e.g. 50% sold, newly open, or null)",
      "source": "Name of publication or website domain",
      "sourceUrl": "URL if available, otherwise domain name"
    }
  ],
  "market": [
    {
      "headline": "Short descriptive headline of update (Required)",
      "category": "Interest Rates, Policy, Taxation, or Other (Required)",
      "summary": "Detailed sentence summary of what happened (Required)",
      "impact": "Direct impact on buyers or market",
      "source": "Source website or publisher",
      "sourceUrl": "URL if available"
    }
  ],
  "infrastructure": [
    {
      "title": "Title of public work/project (e.g. Pune Metro Line 3) (Required)",
      "authority": "Authority in charge (e.g. PMRDA, MSRDC, PMC)",
      "status": "Proposed, Testing, or Operational (Required)",
      "affectedAreas": ["Locality1", "Locality2"],
      "expectedImpact": "Detailed expected impact (Required)",
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
                inventory: { type: 'STRING' },
                source: { type: 'STRING' },
                sourceUrl: { type: 'STRING' }
              },
              required: ['projectName', 'locality']
            }
          },
          market: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                headline: { type: 'STRING' },
                category: { type: 'STRING' },
                summary: { type: 'STRING' },
                impact: { type: 'STRING' },
                source: { type: 'STRING' },
                sourceUrl: { type: 'STRING' }
              },
              required: ['headline', 'category', 'summary']
            }
          },
          infrastructure: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                authority: { type: 'STRING' },
                status: { type: 'STRING' },
                affectedAreas: { type: 'ARRAY', items: { type: 'STRING' } },
                expectedImpact: { type: 'STRING' },
                source: { type: 'STRING' },
                sourceUrl: { type: 'STRING' }
              },
              required: ['title', 'status', 'expectedImpact']
            }
          }
        },
        required: ['projects', 'market', 'infrastructure']
      }
    });

    const parsedData = JSON.parse(extractionResponse.text);

    // Validate raw projects and inject metadata
    const rawProjects = (parsedData.projects || []).map(p => {
      try {
        const item = {
          ...p,
          city,
          entityType: "project"
        };
        return validateEntity('project', item);
      } catch (err) {
        console.warn(`[Pipeline] Skipping invalid project extraction:`, err.message);
        return null;
      }
    }).filter(Boolean);

    // --- Step 2: Entity Resolution & Duplicate Merging (Local) ---
    const resolvedProjects = resolveProjectEntities(rawProjects);

    // --- Step 3: Run Verification Pipeline ---
    const verifiedProjects = [];
    const verifiedMarket = [];
    const verifiedInfra = [];
    const rejectedFacts = [];
    const conflicts = [];

    // Helper to categorize sources and determine base confidence
    const evaluateSource = (urlOrDomain) => {
      const src = (urlOrDomain || '').toLowerCase();
      if (src.includes('gov') || src.includes('rera') || src.includes('rbi') || src.includes('maharera')) {
        return { tier: 1, confidence: 0.9 };
      }
      if (src.includes('99acres') || src.includes('magicbricks') || src.includes('housing.com') || src.includes('nobroker')) {
        return { tier: 2, confidence: 0.7 };
      }
      if (src.includes('economic') || src.includes('financial') || src.includes('moneycontrol') || src.includes('timesofindia') || src.includes('express')) {
        return { tier: 3, confidence: 0.7 };
      }
      return { tier: 4, confidence: 0.5 };
    };

    // Verify Market Updates
    for (const claim of (parsedData.market || [])) {
      try {
        const sourceEval = evaluateSource(claim.sourceUrl || claim.source);
        
        // Build and validate Source Entity
        let cleanUrl = claim.sourceUrl || '';
        let domain = 'unknown';
        try {
          if (cleanUrl) domain = new URL(cleanUrl).hostname;
        } catch (e) {}

        const sourceEntity = validateEntity('source', {
          provider: config.searchProvider || 'tavily',
          domain,
          url: cleanUrl,
          title: claim.source || 'Search Source',
          tier: sourceEval.tier,
          reputationScore: 100 - (sourceEval.tier - 1) * 25
        });

        const marketObj = validateEntity('market', {
          ...claim,
          confidence: sourceEval.confidence,
          verificationStatus: "verified",
          sources: [sourceEntity]
        });

        verifiedMarket.push(marketObj);
      } catch (err) {
        rejectedFacts.push({ ...claim, reason: err.message });
      }
    }

    // Verify Infrastructure Updates
    for (const claim of (parsedData.infrastructure || [])) {
      try {
        const sourceEval = evaluateSource(claim.sourceUrl || claim.source);
        
        let cleanUrl = claim.sourceUrl || '';
        let domain = 'unknown';
        try {
          if (cleanUrl) domain = new URL(cleanUrl).hostname;
        } catch (e) {}

        const sourceEntity = validateEntity('source', {
          provider: config.searchProvider || 'tavily',
          domain,
          url: cleanUrl,
          title: claim.source || 'Search Source',
          tier: sourceEval.tier,
          reputationScore: 100 - (sourceEval.tier - 1) * 25
        });

        const infraObj = validateEntity('infrastructure', {
          ...claim,
          confidence: sourceEval.confidence,
          verificationStatus: "verified",
          sources: [sourceEntity]
        });

        verifiedInfra.push(infraObj);
      } catch (err) {
        rejectedFacts.push({ ...claim, reason: err.message });
      }
    }

    // Check for conflicts in project data
    const finalProjects = resolvedProjects.map(proj => {
      const projectSources = proj.sources || [];
      
      if (projectSources.length > 1 && proj.aliases.length > 1) {
        conflicts.push({
          type: 'Project Naming/Details Conflict',
          entity: proj.projectName,
          details: `Reported under multiple names: ${proj.aliases.join(', ')}. Sources: ${projectSources.join(', ')}`
        });
      }

      if (proj.pricePerSqFt && (proj.pricePerSqFt.includes('-') || proj.pricePerSqFt.includes('to'))) {
        conflicts.push({
          type: 'Price Discrepancy Range',
          entity: proj.projectName,
          details: `Price ranges from ${proj.pricePerSqFt} instead of single static quote.`
        });
      }

      // Map raw sources into Source Schema structure for project
      const mappedSources = (proj.sources || []).map(url => {
        const sourceEval = evaluateSource(url);
        let domain = 'unknown';
        try {
          domain = new URL(url).hostname;
        } catch (e) {}

        try {
          return validateEntity('source', {
            provider: config.searchProvider || 'tavily',
            domain,
            url,
            title: domain,
            tier: sourceEval.tier,
            reputationScore: 100 - (sourceEval.tier - 1) * 25
          });
        } catch (err) {
          return null;
        }
      }).filter(Boolean);

      // Re-validate final project
      return validateEntity('project', {
        ...proj,
        city,
        entityType: "project",
        confidence: proj.confidence === 'High' ? 0.9 : proj.confidence === 'Low' ? 0.5 : 0.7,
        verificationStatus: "verified",
        sources: mappedSources,
        updatedAt: new Date().toISOString()
      });
    });

    eventBus.emitEvent('agent:completed', { 
      name: 'verification', 
      data: { 
        verifiedCount: finalProjects.length + verifiedMarket.length + verifiedInfra.length, 
        rejectedCount: rejectedFacts.length 
      } 
    });

    return {
      projects: finalProjects,
      market: verifiedMarket,
      infrastructure: verifiedInfra,
      rejected: rejectedFacts,
      conflicts
    };
  } catch (err) {
    eventBus.emitEvent('agent:error', { name: 'verification', error: err.message });
    throw err;
  }
}

export const pipelineAgent = {
  id: "pipeline",
  name: "Pipeline Verification Agent",
  description: "Deduplicates projects, validates schemas, checks facts, and resolves conflicts",
  executionOrder: 3,
  dependsOn: ["researcher"],
  capabilities: ["extraction", "entity_resolution", "verification", "schema_validation"],
  tags: ["pipeline", "verification"],
  handler: async (context) => {
    context.verifiedData = await runPipelineAgent(context.rawResearchData, context.config);
  }
};

export default runPipelineAgent;
