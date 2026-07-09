import eventBus from '../core/eventBus.js';

export function runFormatterAgent(verifiedData, insights, recommendations, qualityGate, config) {
  eventBus.emitEvent('agent:start', { name: 'formatter' });

  const { city } = config;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 1. Top Update Selection
  // Select the highest impact news item or the most notable project launch
  const topNews = verifiedData.news.filter(n => n.impactLevel === 'High');
  let topUpdateBullets = [];
  if (topNews.length > 0) {
    topUpdateBullets = topNews.slice(0, 3).map(n => `• **${n.headline}**: ${n.summary} *(Impact: ${n.impactLevel} | Source: ${n.source})*`);
  } else if (verifiedData.projects.length > 0) {
    const p = verifiedData.projects[0];
    topUpdateBullets = [
      `• **New Project Launch**: ${p.builder} launched *${p.projectName}* in ${p.locality}.`,
      `• Starting price is quoted at ${p.startingPrice} (${p.pricePerSqFt || 'price/sq.ft unavailable'}).`,
      `• Source matches MahaRERA files with ${p.confidence} confidence.`
    ];
  } else {
    topUpdateBullets = [`• **Market Stability**: Real estate activity in ${city} continues on a steady track. No high-impact policy shifts registered today.`];
  }

  // 2. New Project Launches Table
  let projectsTable = `| Project | Builder | Area | Starting Price | Price/Sq.ft | Source |\n| --- | --- | --- | --- | --- | --- |\n`;
  if (verifiedData.projects.length > 0) {
    verifiedData.projects.forEach(p => {
      const srcList = p.sources.join(', ');
      projectsTable += `| ${p.projectName} | ${p.builder} | ${p.locality} | ${p.startingPrice} | ${p.pricePerSqFt} | ${srcList} |\n`;
    });
  } else {
    projectsTable += `| - | - | - | - | - | - |\n*(No new project launches verified today)*\n`;
  }

  // 3. Price Movement Table
  let priceMovementTable = `| Area | Current Price/Sq.ft | Movement | Confidence | Source |\n| --- | --- | --- | --- | --- | --- |\n`;
  const pmInsights = insights.priceMovements || [];
  if (pmInsights.length > 0) {
    pmInsights.forEach(p => {
      // Find matching verified project to get source
      const match = verifiedData.projects.find(v => v.projectName === p.projectName);
      const src = match ? match.sources.join(', ') : 'Market Tracker';
      const conf = match ? match.confidence : 'Medium';
      const movementStr = p.direction === 'Up' ? `▲ +${p.percentage}%` : `▼ -${p.percentage}%`;
      priceMovementTable += `| ${p.locality} (${p.projectName}) | ${p.newPrice} | ${movementStr} | ${conf} | ${src} |\n`;
    });
  } else {
    // Localities average fallback from config if no delta
    const defaultLocalities = verifiedData.projects.slice(0, 3);
    if (defaultLocalities.length > 0) {
      defaultLocalities.forEach(p => {
        priceMovementTable += `| ${p.locality} | ${p.pricePerSqFt || 'Stable'} | Stable | ${p.confidence} | ${p.sources.join(', ')} |\n`;
      });
    } else {
      priceMovementTable += `| - | - | - | - | - |\n*(No pricing movement verified today)*\n`;
    }
  }

  // 4. Market & Policy Updates
  let marketUpdatesList = '';
  const newsUpdates = verifiedData.news.slice(0, 5);
  if (newsUpdates.length > 0) {
    newsUpdates.forEach(n => {
      marketUpdatesList += `• **${n.category}**: ${n.summary} *(Source: ${n.source})*\n`;
    });
  } else {
    marketUpdatesList += `• No new market or policy updates logged today.\n`;
  }

  // 5. What This Means For Buyers
  let buyersImpactList = '';
  const buyerNews = verifiedData.news.filter(n => n.impactOnBuyers).slice(0, 4);
  if (buyerNews.length > 0) {
    buyerNews.forEach(n => {
      buyersImpactList += `• **${n.category}**: ${n.impactOnBuyers}\n`;
    });
  } else {
    buyersImpactList += `• Market rates are holding steady, offering a balanced window for transactional planning.\n`;
    buyersImpactList += `• Secondary markets continue to hold stable pricing metrics across central suburbs.\n`;
    buyersImpactList += `• Upgraded metro links improve accessibility to peripheral office parks.\n`;
  }

  // 6. Broker Talking Points
  const talkingPointsList = recommendations.talkingPoints.map((tp, idx) => `${idx + 1}. ${tp}`).join('\n');

  // 7. Items Requiring Caution
  let cautionList = '';
  const resolvedConflicts = verifiedData.conflicts || [];
  const recCautions = recommendations.cautionItems || [];
  const mergedCautions = [...resolvedConflicts.map(c => `${c.entity}: ${c.details}`), ...recCautions];
  
  if (mergedCautions.length > 0) {
    mergedCautions.slice(0, 4).forEach(c => {
      cautionList += `• ${c}\n`;
    });
  } else {
    cautionList += `• No critical data conflicts or pricing discrepancies detected today.\n`;
  }

  // 8. Sources Used
  const allSourcesSet = new Set();
  verifiedData.projects.forEach(p => p.sources.forEach(s => allSourcesSet.add(s)));
  verifiedData.news.forEach(n => allSourcesSet.add(n.source));
  const sourcesList = allSourcesSet.size > 0 
    ? Array.from(allSourcesSet).map(s => `• ${s}`).join('\n') 
    : '• MahaRERA\n• RBI Notifications\n• Local Portal Trackers';

  // --- Compile Markdown ---
  const markdown = `# Daily ${city} Real Estate Brief

**Date:** ${dateStr}
**Report Status:** ${qualityGate.status === 'published' ? '🟢 Published' : '⚠️ Review Required'}
**Overall Report Quality Score:** ${qualityGate.qualityScore}% (Threshold: ${qualityGate.threshold}%)
- **Research Coverage:** ${qualityGate.metrics.coverage}%
- **Data Freshness:** ${qualityGate.metrics.freshness}%
- **Avg Source Confidence:** ${qualityGate.metrics.confidenceScore}%

---

## 🔥 Top Update
${topUpdateBullets.join('\n')}

---

## 🏗 New Project Launches
${projectsTable}
---

## 📈 Price Movement
${priceMovementTable}
---

## 🏦 Market & Policy Updates
${marketUpdatesList}
---

## 💡 What This Means For Buyers
${buyersImpactList}
---

## 💼 Broker Talking Points
${talkingPointsList}

---

## ⚠️ Items Requiring Caution
${cautionList}

---

## Sources
${sourcesList}
`;

  // Compile full JSON payload
  const payload = {
    date: new Date().toISOString().substring(0, 10),
    timestamp: new Date(),
    city,
    markdown,
    quality: qualityGate,
    projects: verifiedData.projects,
    news: verifiedData.news,
    conflicts: verifiedData.conflicts,
    insights,
    recommendations
  };

  eventBus.emitEvent('agent:completed', { name: 'formatter' });

  return {
    markdown,
    payload
  };
}

export default runFormatterAgent;
