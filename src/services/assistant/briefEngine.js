/**
 * briefEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend-only query engine for the AI Brief Assistant.
 *
 * Receives today's briefData (from Firestore `daily_briefs/today`) and
 * optionally the archive list, then pattern-matches user questions and returns
 * a structured answer with citations drawn exclusively from that verified data.
 *
 * No external API calls. No hallucination. Every statement is traceable to
 * a field in the normalized schema.
 */

// ─── Intent Detection ──────────────────────────────────────────────────────────
const INTENTS = [
  { id: 'summarize_market',    patterns: [/summarize|summary|overview|what.?s happening|what happened|today.?s market|morning brief/i] },
  { id: 'locality_profile',    patterns: [/what.?(changed|happened|new).+in\s+(\w+)|tell me about\s+(\w+)|(\w+)\s+update|(\w+)\s+market/i] },
  { id: 'compare_localities',  patterns: [/compare\s+(\w+)\s+(?:vs?\.?\s*|and\s+|with\s+)(\w+)/i] },
  { id: 'recommendation',      patterns: [/should i.*(recommend|pitch|show|buy|invest)|recommend\s+(\w+)|good time.*(buy|invest)|best locality/i] },
  { id: 'project_launches',    patterns: [/project.*(launch|launched|new)|new launch|what.*(launched|listed)|launches this week/i] },
  { id: 'price_trends',        patterns: [/price.*(change|trend|movement|increase|decrease|rise|fall)|pricing|per sq.?ft/i] },
  { id: 'infrastructure',      patterns: [/infra|metro|road|connectivity|transport|station|highway/i] },
  { id: 'policy',              patterns: [/policy|rbi|repo rate|stamp duty|rera|regulation|government/i] },
  { id: 'builder_activity',    patterns: [/builder|developer|who.*(building|launching)|lodha|godrej|prestige/i] },
  { id: 'best_investment',     patterns: [/best.*(invest|buy|locality|area)|top locality|where.*(buy|invest)/i] },
];

function detectIntent(query) {
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => p.test(query))) return intent.id;
  }
  return 'general';
}

// ─── Locality extractor ────────────────────────────────────────────────────────
const KNOWN_LOCALITIES = [
  'baner', 'wakad', 'kharadi', 'hinjewadi', 'viman nagar', 'balewadi',
  'aundh', 'kothrud', 'hadapsar', 'koregaon park', 'kalyani nagar',
  'undri', 'kondhwa', 'nibm', 'pisoli', 'talegaon', 'ambegaon',
];

function extractLocalities(query, briefData) {
  const q = query.toLowerCase();
  const found = new Set();

  // From known list
  KNOWN_LOCALITIES.forEach(l => { if (q.includes(l)) found.add(l); });

  // From briefData projects
  (briefData.projects || []).forEach(p => {
    const loc = (p.locality || '').toLowerCase();
    if (q.includes(loc)) found.add(loc);
  });

  return Array.from(found);
}

// ─── Citation builder ──────────────────────────────────────────────────────────
function cite(source, field) {
  return { source, field };
}

// ─── Number formatters ─────────────────────────────────────────────────────────
function fmtPrice(n) {
  if (!n) return null;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
function avgOf(arr) {
  const valid = arr.filter(n => !isNaN(n) && n > 0);
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
}

// ─── Data Accessors ────────────────────────────────────────────────────────────
function getLocalityData(locality, briefData) {
  const loc = (locality || '').toLowerCase();
  const projects = (briefData.projects || []).filter(p =>
    (p.locality || '').toLowerCase() === loc
  );
  const infra = (briefData.infrastructure || []).filter(i =>
    (i.affectedAreas || []).some(a => a.toLowerCase() === loc)
  );
  const insights = (briefData.insights || []).filter(i =>
    (i.description || '').toLowerCase().includes(loc)
  );
  const market = (briefData.market || []).filter(m =>
    (m.headline || '').toLowerCase().includes(loc) ||
    (m.affectedLocalities || []).some(a => a.toLowerCase() === loc)
  );

  const prices = projects
    .map(p => parseFloat(String(p.pricePerSqFt).replace(/[^0-9.]/g, '')))
    .filter(n => !isNaN(n) && n > 0);
  const avgPrice = avgOf(prices);

  const launches = projects.filter(p => p.status === 'New Launch' || p.launchType === 'new');
  const builders  = [...new Set(projects.map(p => p.builder).filter(Boolean))];

  return { projects, infra, insights, market, avgPrice, launches, builders };
}

// ─── Response Builders ─────────────────────────────────────────────────────────

function buildSummary(briefData) {
  const { projects = [], market = [], infrastructure = [], insights = [] } = briefData;
  const launches  = projects.filter(p => p.status === 'New Launch');
  const policyItems = market.filter(m => m.category === 'Policy' || m.category === 'Interest Rates');
  const topMarket = market[0];
  const topInfra  = infrastructure[0];
  const topInsight = insights[0];

  const prices = projects
    .map(p => parseFloat(String(p.pricePerSqFt).replace(/[^0-9.]/g, '')))
    .filter(n => !isNaN(n) && n > 0);
  const cityAvg = avgOf(prices);

  const paragraphs = [];
  const citations  = [];

  paragraphs.push(
    `Today's verified brief covers **${projects.length} projects** across ${briefData.city || 'Pune'}, with **${launches.length} new launch${launches.length !== 1 ? 'es' : ''}** recorded this cycle.`
  );
  citations.push(cite('daily_briefs/today → projects', 'count, status'));

  if (cityAvg) {
    paragraphs.push(`The city-wide average indexed price stands at **₹${cityAvg.toLocaleString('en-IN')}/sq.ft**.`);
    citations.push(cite('daily_briefs/today → projects[].pricePerSqFt', 'mean'));
  }

  if (topMarket) {
    paragraphs.push(`**Biggest market update:** ${topMarket.headline} — ${topMarket.summary}`);
    citations.push(cite('daily_briefs/today → market[0]', 'headline, summary'));
  }

  if (topInfra) {
    paragraphs.push(`**Infrastructure:** ${topInfra.title} is currently *${topInfra.status}*, affecting ${(topInfra.affectedAreas || []).join(', ')}.`);
    citations.push(cite('daily_briefs/today → infrastructure[0]', 'title, status, affectedAreas'));
  }

  if (policyItems.length > 0) {
    paragraphs.push(`**Policy:** ${policyItems[0].headline} — ${policyItems[0].summary}`);
    citations.push(cite('daily_briefs/today → market[policy]', 'headline, summary'));
  }

  if (topInsight) {
    paragraphs.push(`**AI Insight:** ${topInsight.description}`);
    citations.push(cite('daily_briefs/today → insights[0]', 'description'));
  }

  return { paragraphs, citations, intent: 'summarize_market' };
}

function buildLocalityProfile(locality, briefData) {
  const d = getLocalityData(locality, briefData);
  const cap = l => l.charAt(0).toUpperCase() + l.slice(1);
  const paragraphs = [];
  const citations  = [];

  if (d.projects.length === 0 && d.infra.length === 0 && d.market.length === 0) {
    return {
      paragraphs: [`No verified data for **${cap(locality)}** was found in today's brief. This locality may not have active listings this cycle.`],
      citations: [cite('daily_briefs/today → projects', 'locality filter returned 0')],
      intent: 'locality_profile',
    };
  }

  paragraphs.push(`**${cap(locality)}** has **${d.projects.length} verified project${d.projects.length !== 1 ? 's' : ''}** listed in today's index.`);
  citations.push(cite('daily_briefs/today → projects', `locality === "${locality}"`));

  if (d.avgPrice) {
    paragraphs.push(`Indexed average price: **₹${d.avgPrice.toLocaleString('en-IN')}/sq.ft**.`);
    citations.push(cite('daily_briefs/today → projects[].pricePerSqFt', 'mean'));
  }

  if (d.launches.length > 0) {
    const names = d.launches.map(p => `${p.projectName} (${p.startingPrice || p.pricePerSqFt})`).join(', ');
    paragraphs.push(`**${d.launches.length} new launch${d.launches.length > 1 ? 'es' : ''}:** ${names}.`);
    citations.push(cite('daily_briefs/today → projects[].status', '"New Launch"'));
  }

  if (d.infra.length > 0) {
    paragraphs.push(`**Infrastructure:** ${d.infra.map(i => `${i.title} (${i.status})`).join('; ')}.`);
    citations.push(cite('daily_briefs/today → infrastructure[].affectedAreas', `includes "${locality}"`));
  }

  if (d.insights.length > 0) {
    paragraphs.push(`**AI Insight:** ${d.insights[0].description}`);
    citations.push(cite('daily_briefs/today → insights[0]', 'description'));
  }

  if (d.builders.length > 0) {
    paragraphs.push(`Active builders: **${d.builders.join(', ')}**.`);
    citations.push(cite('daily_briefs/today → projects[].builder', 'unique values'));
  }

  return { paragraphs, citations, intent: 'locality_profile' };
}

function buildComparison(locA, locB, briefData) {
  const a   = getLocalityData(locA, briefData);
  const b   = getLocalityData(locB, briefData);
  const capA = locA.charAt(0).toUpperCase() + locA.slice(1);
  const capB = locB.charAt(0).toUpperCase() + locB.slice(1);
  const paragraphs = [];
  const citations  = [];

  const winner = (aVal, bVal, higherIsBetter = true) => {
    if (!aVal && !bVal) return null;
    if (!aVal) return capB;
    if (!bVal) return capA;
    return (higherIsBetter ? aVal > bVal : aVal < bVal) ? capA : capB;
  };

  paragraphs.push(`**${capA} vs ${capB}** — side-by-side comparison from today's verified brief.`);

  // Price
  if (a.avgPrice || b.avgPrice) {
    const aStr = a.avgPrice ? `₹${a.avgPrice.toLocaleString('en-IN')}` : 'N/A';
    const bStr = b.avgPrice ? `₹${b.avgPrice.toLocaleString('en-IN')}` : 'N/A';
    const cheaper = winner(a.avgPrice, b.avgPrice, false);
    paragraphs.push(`**Price/sq.ft:** ${capA} at ${aStr} vs ${capB} at ${bStr}. ${cheaper ? `${cheaper} offers the more accessible entry point.` : ''}`);
    citations.push(cite('daily_briefs/today → projects[].pricePerSqFt', 'mean by locality'));
  }

  // Launches
  const launchWinner = winner(a.launches.length, b.launches.length);
  paragraphs.push(`**New Launches:** ${capA} has ${a.launches.length}, ${capB} has ${b.launches.length}. ${launchWinner ? `${launchWinner} shows stronger developer activity.` : 'Both markets are stable.'}`);
  citations.push(cite('daily_briefs/today → projects[].status', '"New Launch" count by locality'));

  // Infrastructure
  const infraWinner = winner(a.infra.length, b.infra.length);
  paragraphs.push(`**Infrastructure Activity:** ${capA} has ${a.infra.length} active infra projects, ${capB} has ${b.infra.length}. ${infraWinner && (a.infra.length !== b.infra.length) ? `${infraWinner} benefits from more active corridor development.` : ''}`);
  citations.push(cite('daily_briefs/today → infrastructure[].affectedAreas', 'count by locality'));

  // Verdict
  const scores = {
    [locA]: (a.launches.length * 2) + a.infra.length + (a.avgPrice ? 1 : 0),
    [locB]: (b.launches.length * 2) + b.infra.length + (b.avgPrice ? 1 : 0),
  };
  const topPick = scores[locA] > scores[locB] ? capA : scores[locB] > scores[locA] ? capB : null;
  if (topPick) {
    paragraphs.push(`**Recommendation:** Based on today's verified data, **${topPick}** shows stronger composite market signals — higher developer activity and infrastructure momentum.`);
  } else {
    paragraphs.push(`Both localities show comparable signals today. Consider client budget and commute preference as the deciding factors.`);
  }

  return { paragraphs, citations, intent: 'compare_localities' };
}

function buildRecommendation(locality, briefData) {
  const d = getLocalityData(locality, briefData);
  const cap = locality.charAt(0).toUpperCase() + locality.slice(1);
  const paragraphs = [];
  const citations  = [];

  const score = (d.launches.length * 3) + (d.infra.length * 2) + (d.projects.length) + (d.insights.length);
  const isStrong = score >= 5;
  const isMid    = score >= 2 && score < 5;

  paragraphs.push(`**Should you recommend ${cap} today?**`);
  citations.push(cite('daily_briefs/today → projects, infrastructure, insights', `locality === "${locality}"`));

  if (d.projects.length === 0) {
    paragraphs.push(`No verified projects are indexed for ${cap} in today's brief. Avoid making pricing commitments without fresh data.`);
    return { paragraphs, citations, signal: 'watch', intent: 'recommendation' };
  }

  if (isStrong) {
    paragraphs.push(`✅ **Yes — strong signals today.** ${cap} shows ${d.launches.length > 0 ? `${d.launches.length} new launch${d.launches.length > 1 ? 'es' : ''}, ` : ''}${d.infra.length > 0 ? `${d.infra.length} active infra projects, ` : ''}and ${d.projects.length} verified listings.`);
  } else if (isMid) {
    paragraphs.push(`🟠 **Conditionally — monitor signals.** ${cap} has ${d.projects.length} verified project${d.projects.length !== 1 ? 's' : ''} but limited new launches or infrastructure activity today.`);
  } else {
    paragraphs.push(`⚠️ **Exercise caution.** ${cap} data is thin today. Wait for more verified signals before pitching to premium buyers.`);
  }

  if (d.avgPrice) {
    paragraphs.push(`**Entry price:** ₹${d.avgPrice.toLocaleString('en-IN')}/sq.ft (indexed average across ${d.projects.length} verified projects).`);
    citations.push(cite('daily_briefs/today → projects[].pricePerSqFt', 'mean'));
  }

  if (d.insights.length > 0) {
    paragraphs.push(`**AI context:** ${d.insights[0].description}`);
    citations.push(cite('daily_briefs/today → insights', `mentions "${locality}"`));
  }

  const topProj = d.projects[0];
  if (topProj) {
    paragraphs.push(`**Lead project:** ${topProj.projectName} by ${topProj.builder} — ${topProj.startingPrice || topProj.pricePerSqFt}${topProj.possessionStatus ? ` · ${topProj.possessionStatus}` : ''}.`);
    citations.push(cite('daily_briefs/today → projects[0]', 'projectName, builder, startingPrice'));
  }

  const signal = isStrong ? 'opportunity' : isMid ? 'watch' : 'risk';
  return { paragraphs, citations, signal, intent: 'recommendation' };
}

function buildProjectLaunches(briefData) {
  const launches = (briefData.projects || []).filter(p =>
    p.status === 'New Launch' || p.launchType === 'new'
  );
  const paragraphs = [];
  const citations  = [];

  citations.push(cite('daily_briefs/today → projects[].status', '"New Launch"'));

  if (launches.length === 0) {
    paragraphs.push(`No new project launches are recorded in today's verified brief. The index reflects ${briefData.projects?.length || 0} tracked projects, all under existing listings.`);
    return { paragraphs, citations, intent: 'project_launches' };
  }

  paragraphs.push(`**${launches.length} new launch${launches.length > 1 ? 'es' : ''} indexed today:**`);
  launches.forEach(p => {
    paragraphs.push(`• **${p.projectName}** by ${p.builder} in ${p.locality} — ${p.startingPrice || p.pricePerSqFt}${p.reraRegistered ? ' · ✅ RERA Registered' : ''}`);
    citations.push(cite(`daily_briefs/today → projects["${p.projectName}"]`, 'projectName, builder, locality, startingPrice'));
  });

  return { paragraphs, citations, intent: 'project_launches' };
}

function buildPriceTrends(briefData) {
  const { projects = [], insights = [] } = briefData;
  const paragraphs = [];
  const citations  = [];

  // Group by locality
  const byLocality = {};
  projects.forEach(p => {
    const loc = p.locality || 'Unknown';
    if (!byLocality[loc]) byLocality[loc] = [];
    byLocality[loc].push(parseFloat(String(p.pricePerSqFt).replace(/[^0-9.]/g, '')));
  });

  const rows = Object.entries(byLocality)
    .map(([loc, prices]) => ({ loc, avg: avgOf(prices.filter(n => !isNaN(n))) }))
    .filter(r => r.avg)
    .sort((a, b) => b.avg - a.avg);

  paragraphs.push(`**Today's Price Index by Locality** — averaged from verified MahaRERA-listed projects:`);
  rows.forEach(r => {
    paragraphs.push(`• **${r.loc}:** ₹${r.avg.toLocaleString('en-IN')}/sq.ft`);
  });
  citations.push(cite('daily_briefs/today → projects[].pricePerSqFt', 'mean grouped by locality'));

  const trendInsights = insights.filter(i => i.category === 'Trend' || (i.description || '').match(/%/));
  if (trendInsights.length > 0) {
    paragraphs.push(`**AI Trend Observations:**`);
    trendInsights.slice(0, 2).forEach(i => {
      paragraphs.push(`• ${i.description}`);
    });
    citations.push(cite('daily_briefs/today → insights[category="Trend"]', 'description'));
  }

  return { paragraphs, citations, intent: 'price_trends' };
}

function buildInfraUpdate(briefData) {
  const { infrastructure = [] } = briefData;
  const paragraphs = [];
  const citations  = [];

  if (infrastructure.length === 0) {
    paragraphs.push('No infrastructure updates are logged in today\'s verified brief.');
    return { paragraphs, citations, intent: 'infrastructure' };
  }

  paragraphs.push(`**${infrastructure.length} active infrastructure project${infrastructure.length > 1 ? 's' : ''} tracked today:**`);
  infrastructure.forEach(i => {
    const areas = (i.affectedAreas || []).join(', ');
    paragraphs.push(`• **${i.title}** — *${i.status}*${areas ? ` · Affects: ${areas}` : ''}${i.completionDate ? ` · Expected: ${i.completionDate}` : ''}`);
    paragraphs.push(`  ↳ ${i.expectedImpact}`);
    citations.push(cite(`daily_briefs/today → infrastructure["${i.title}"]`, 'title, status, affectedAreas, expectedImpact'));
  });

  return { paragraphs, citations, intent: 'infrastructure' };
}

function buildPolicyUpdate(briefData) {
  const { market = [] } = briefData;
  const policies = market.filter(m =>
    m.category === 'Policy' || m.category === 'Interest Rates' || m.category === 'Regulatory'
  );
  const paragraphs = [];
  const citations  = [];

  if (policies.length === 0) {
    paragraphs.push(`No specific policy updates are logged in today's brief. The market is operating under the current RBI and state regulatory framework.`);
    return { paragraphs, citations, intent: 'policy' };
  }

  paragraphs.push(`**${policies.length} policy update${policies.length > 1 ? 's' : ''} in today's brief:**`);
  policies.forEach(p => {
    paragraphs.push(`• **${p.headline}**${p.category ? ` [${p.category}]` : ''}`);
    paragraphs.push(`  ${p.summary}`);
    if (p.impact) paragraphs.push(`  *Buyer impact: ${p.impact}*`);
    citations.push(cite(`daily_briefs/today → market["${p.headline}"]`, 'headline, summary, impact'));
  });

  return { paragraphs, citations, intent: 'policy' };
}

function buildBuilderActivity(briefData) {
  const { projects = [] } = briefData;
  const builderMap = {};
  projects.forEach(p => {
    if (!p.builder) return;
    if (!builderMap[p.builder]) builderMap[p.builder] = [];
    builderMap[p.builder].push(p);
  });
  const builders = Object.entries(builderMap).sort((a, b) => b[1].length - a[1].length);
  const paragraphs = [];
  const citations  = [];

  if (builders.length === 0) {
    paragraphs.push('No builder data is available in today\'s verified brief.');
    return { paragraphs, citations, intent: 'builder_activity' };
  }

  paragraphs.push(`**Active builders in today's index (${builders.length} total):**`);
  builders.slice(0, 6).forEach(([builder, projs]) => {
    const localities = [...new Set(projs.map(p => p.locality))].join(', ');
    const launches   = projs.filter(p => p.status === 'New Launch').length;
    paragraphs.push(`• **${builder}** — ${projs.length} project${projs.length > 1 ? 's' : ''} in ${localities}${launches > 0 ? ` · ${launches} new launch` : ''}`);
    citations.push(cite(`daily_briefs/today → projects[builder="${builder}"]`, 'projectName, locality, status'));
  });

  return { paragraphs, citations, intent: 'builder_activity' };
}

function buildBestInvestment(briefData) {
  const { projects = [], insights = [], infrastructure = [] } = briefData;
  const paragraphs = [];
  const citations  = [];

  // Score each locality
  const scoreMap = {};
  projects.forEach(p => {
    const loc = (p.locality || '').toLowerCase();
    if (!scoreMap[loc]) scoreMap[loc] = { projects: 0, launches: 0, infra: 0, insights: 0 };
    scoreMap[loc].projects++;
    if (p.status === 'New Launch') scoreMap[loc].launches++;
    if ((p.confidenceScore || p.confidence || 0) > 0.8) scoreMap[loc].insights++;
  });
  infrastructure.forEach(i => {
    (i.affectedAreas || []).forEach(a => {
      const loc = a.toLowerCase();
      if (!scoreMap[loc]) scoreMap[loc] = { projects: 0, launches: 0, infra: 0, insights: 0 };
      scoreMap[loc].infra++;
    });
  });

  const ranked = Object.entries(scoreMap)
    .map(([loc, s]) => ({ loc, score: s.projects + (s.launches * 2) + (s.infra * 1.5) + s.insights }))
    .sort((a, b) => b.score - a.score);

  citations.push(cite('daily_briefs/today → projects, infrastructure, insights', 'scored by locality'));

  if (ranked.length === 0) {
    paragraphs.push('Insufficient data in today\'s brief to rank localities. Run the engine to generate fresh data.');
    return { paragraphs, citations, intent: 'best_investment' };
  }

  paragraphs.push('**Top localities ranked by today\'s composite market signals:**');
  ranked.slice(0, 4).forEach((r, idx) => {
    const d = getLocalityData(r.loc, briefData);
    const label = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
    const cap   = r.loc.charAt(0).toUpperCase() + r.loc.slice(1);
    paragraphs.push(`${label} **${cap}** — ${d.projects.length} projects${d.launches.length > 0 ? `, ${d.launches.length} new launch${d.launches.length > 1 ? 'es' : ''}` : ''}${d.infra.length > 0 ? `, ${d.infra.length} infra upgrade${d.infra.length > 1 ? 's' : ''}` : ''}${d.avgPrice ? ` · ₹${d.avgPrice.toLocaleString('en-IN')}/sq.ft` : ''}`);
  });

  const top = ranked[0];
  const topCap = top.loc.charAt(0).toUpperCase() + top.loc.slice(1);
  paragraphs.push(`**Verdict:** **${topCap}** leads today's composite signal score. Recommend this to buyers with a mid-to-long-term horizon.`);

  return { paragraphs, citations, intent: 'best_investment' };
}

// ─── General / Fallback ────────────────────────────────────────────────────────
function buildGeneral(query, briefData) {
  const { projects = [], market = [], infrastructure = [] } = briefData;
  return {
    paragraphs: [
      `I can help you analyse today's verified brief. Try asking:`,
      `• *"Summarize today's market"*`,
      `• *"What changed in Baner?"*`,
      `• *"Compare Baner vs Wakad"*`,
      `• *"Should I recommend Kharadi today?"*`,
      `• *"What projects launched this week?"*`,
      `• *"What are today's price trends?"*`,
      `Today's brief covers **${projects.length} projects**, **${market.length} market updates**, and **${infrastructure.length} infrastructure items**.`,
    ],
    citations: [cite('daily_briefs/today', 'projects.length, market.length, infrastructure.length')],
    intent: 'general',
  };
}

// ─── Main Resolver ─────────────────────────────────────────────────────────────
/**
 * @param {string} query       — user's question
 * @param {object} briefData   — today's Firestore brief document
 * @param {Array}  [archive]   — optional list of historical briefs
 * @returns {{ paragraphs: string[], citations: Array, intent: string, signal?: string }}
 */
export function resolveQuery(query, briefData, archive = []) {
  if (!briefData) {
    return {
      paragraphs: ['No brief data is available yet. Connect Firestore and run the engine to generate today\'s intelligence report.'],
      citations:  [],
      intent:     'error',
    };
  }

  const intent    = detectIntent(query);
  const localities = extractLocalities(query, briefData);

  switch (intent) {
    case 'summarize_market':  return buildSummary(briefData);
    case 'locality_profile':  return buildLocalityProfile(localities[0] || 'baner', briefData);
    case 'compare_localities': {
      if (localities.length >= 2) return buildComparison(localities[0], localities[1], briefData);
      const compMatch = query.match(/compare\s+(\w+)\s+(?:vs?\.?\s*|and\s+|with\s+)(\w+)/i);
      if (compMatch) return buildComparison(compMatch[1].toLowerCase(), compMatch[2].toLowerCase(), briefData);
      return buildGeneral(query, briefData);
    }
    case 'recommendation': {
      const recLocality = localities[0] || (query.match(/\b(\w+)\b/g) || []).find(w =>
        KNOWN_LOCALITIES.includes(w.toLowerCase())
      );
      return buildRecommendation(recLocality || 'baner', briefData);
    }
    case 'project_launches':  return buildProjectLaunches(briefData);
    case 'price_trends':      return buildPriceTrends(briefData);
    case 'infrastructure':    return buildInfraUpdate(briefData);
    case 'policy':            return buildPolicyUpdate(briefData);
    case 'builder_activity':  return buildBuilderActivity(briefData);
    case 'best_investment':   return buildBestInvestment(briefData);
    default: {
      if (localities.length === 1) return buildLocalityProfile(localities[0], briefData);
      return buildGeneral(query, briefData);
    }
  }
}

// ─── Suggested questions ────────────────────────────────────────────────────────
export const SUGGESTED_QUESTIONS = [
  { label: 'Summarize today\'s market',     icon: '📊' },
  { label: 'What projects launched today?', icon: '🏗' },
  { label: 'Best locality to recommend?',   icon: '🏆' },
  { label: 'What changed in Baner?',        icon: '📍' },
  { label: 'Compare Baner vs Wakad',        icon: '⚖️' },
  { label: 'Today\'s price trends',         icon: '📈' },
  { label: 'Infrastructure updates',        icon: '🚇' },
  { label: 'Policy changes today',          icon: '🏛' },
];
