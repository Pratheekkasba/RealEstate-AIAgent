import fs from 'fs';
import path from 'path';
import { runPlannerAgent } from './agents/planner.js';
import { runPipelineAgent } from './agents/pipeline.js';
import { runInsightAgent } from './agents/insight.js';
import { runRecommendationsAgent } from './agents/recommendations.js';
import { runFormatterAgent } from './agents/formatter.js';
import evaluateQualityGate from './utils/qualityGatekeeper.js';
import healthMonitor from './utils/healthMonitor.js';
import eventBus from './core/eventBus.js';

// Configuration
const config = {
  city: "Pune",
  priority_localities: ["Baner", "Wakad", "Kharadi", "Hinjawadi"],
  cache_expiry_hours: 12,
  quality_publish_threshold: 70
};

// Mock raw research data representing search outcomes
const mockResearchData = {
  projects: [
    {
      query: "new residential projects launched in Pune 2026",
      source: "mock_search",
      data: `
- Project Name: Lodha Sylvan Phase 3
  Builder: Lodha Group
  Locality: Hinjewadi
  Launch Date: March 2026
  Starting Price: 95 Lakhs
  Price per Sq.ft: 8,700/sq.ft
  Inventory Status: Newly launched, open for bookings
  Source: Lodha Group official site

- Project Name: Yashwin Orizzonte by VJ
  Builder: Vilas Javdekar Developers
  Locality: Wakad
  Launch Date: January 2026
  Starting Price: 85 Lakhs
  Price per Sq.ft: 8,200/sq.ft
  Inventory Status: 40% units booked
  Source: RERA Maharashtra
      `
    },
    {
      query: "RERA registered projects launches Pune builder announcements",
      source: "mock_search",
      data: `
- Project Name: VJ Yashwin Orizzonte
  Builder: Vilas Javdekar
  Locality: Wakad
  Launch Date: January 2026
  Starting Price: 84 Lakhs
  Price per Sq.ft: 8,100/sq.ft
  Inventory Status: Registrations active
  Source: MahaRERA registry
      `
    }
  ],
  market: [
    {
      query: "RBI interest rates home loans stamp duty notifications Pune",
      source: "mock_search",
      data: `
- Headline: RBI keeps Repo Rate unchanged at 6.5%
  Summary: The Reserve Bank of India decided to hold interest rates steady in its latest monetary policy meeting, maintaining home loan rates between 8.4% and 9.5% for most major banks.
  Impact on Buyers: Stable borrowing costs offer buyers a predictable planning window.
  Impact Level: High
  Source: Reserve Bank of India
      `
    }
  ],
  infrastructure: [
    {
      query: "metro corridor expansion highway road developments Pune connectivity",
      source: "mock_search",
      data: `
- Headline: Pune Metro Line 3 Hinjewadi-Shivajinagar testing begins
  Summary: Trial runs have successfully commenced on Pune Metro Line 3, connecting Hinjewadi IT park to central Shivajinagar. Commercial operations are targeted for late 2026.
  Impact on Buyers: Significantly reduces commute times, boosting rental demand and property values in Wakad, Hinjewadi, and Baner.
  Impact Level: High
  Source: Pune Metro Rail Corporation
      `
    }
  ]
};

// Mock yesterday's historical brief data
const mockYesterdayData = {
  date: "2026-07-08",
  city: "Pune",
  projects: [
    {
      projectName: "Lodha Sylvan Phase 3",
      builder: "Lodha Group",
      locality: "Hinjewadi",
      startingPrice: "95 Lakhs",
      pricePerSqFt: "8,500/sq.ft", // lower price yesterday to test price change
      launchDate: "March 2026",
      priceMovement: "Stable",
      sources: ["Lodha Group Portal"]
    }
  ],
  news: []
};

async function runLocalDryRun() {
  console.log("==================================================");
  console.log("Starting Local Dry-Run Multi-Agent Engine Test");
  console.log("==================================================\n");

  try {
    // 1. Run Pipeline Agent to parse, deduplicate, and verify
    console.log("[Test] Running Pipeline Agent (Extraction & Verification)...");
    const verifiedData = await runPipelineAgent(mockResearchData, config);
    console.log(`[Test] Extraction completed: Resolved ${verifiedData.projects.length} projects, verified ${verifiedData.news.length} news entries.`);
    console.log(`[Test] Mapped Conflicts:`, verifiedData.conflicts);

    // 2. Run Insight Agent (Today vs Yesterday)
    console.log("\n[Test] Running Insight Agent (Temporal Analysis)...");
    const insights = await runInsightAgent(verifiedData, mockYesterdayData, config);
    console.log(`[Test] Insight Results:`, insights);

    // 3. Mock Recommendations Agent
    console.log("\n[Test] Running Recommendations Agent...");
    const recommendations = {
      opportunity: {
        headline: "Hinjewadi-Wakad Tech Corridor Surge",
        description: "Trial runs starting on Pune Metro Line 3 will boost commuter accessibility. Target properties in Hinjewadi Phase 3 and Wakad for medium-term yield growth."
      },
      talkingPoints: [
        "RBI holds interest rates steady at 6.5%, offering a stable rate environment for locking home loans.",
        "Pune Metro Line 3 Hinjewadi-Shivajinagar trial runs are active, cutting down travel times.",
        "Lodha Sylvan price per sq.ft grew from 8,500 to 8,700/sq.ft (+2.4%) since yesterday.",
        "Vilas Javdekar Yashwin Orizzonte registrations are active in Wakad starting at 84-85 Lakhs.",
        "MahaRERA registrations provide secure and verified end-user buying pathways."
      ],
      cautionItems: [
        "Wakad: Minor pricing conflict noted between RERA files (8,100/sq.ft) and portal listings (8,200/sq.ft). Verify base rate before quoting."
      ]
    };

    // 4. Evaluate Quality Gate
    console.log("\n[Test] Running Quality Gatekeeper...");
    const qualityGate = evaluateQualityGate({
      plannedSearchesCount: 6,
      successfulSearchesCount: 6,
      verifiedFacts: verifiedData.news.concat(verifiedData.projects),
      rejectedFacts: verifiedData.rejected,
      threshold: config.quality_publish_threshold
    });
    console.log("[Test] Quality Gate Status:", qualityGate);

    // 5. Run Formatter Agent
    console.log("\n[Test] Running Formatter Agent...");
    const formattedReport = runFormatterAgent(verifiedData, insights, recommendations, qualityGate, config);

    // Write Outputs
    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(outputDir, 'test_brief.md'), formattedReport.markdown, 'utf8');
    fs.writeFileSync(path.resolve(outputDir, 'test_brief.json'), JSON.stringify(formattedReport.payload, null, 2), 'utf8');

    // Health Monitor complete
    const healthSummary = healthMonitor.complete();
    fs.writeFileSync(path.resolve(outputDir, 'test_health.json'), JSON.stringify(healthSummary, null, 2), 'utf8');

    console.log("\n==================================================");
    console.log("Local Dry-Run Verification Successful!");
    console.log("- Formatted Brief: output/test_brief.md");
    console.log("- JSON Payload: output/test_brief.json");
    console.log("- Health Summary: output/test_health.json");
    console.log("==================================================");

  } catch (err) {
    console.error("Local Dry-Run Failed:", err);
    process.exit(1);
  }
}

runLocalDryRun();
