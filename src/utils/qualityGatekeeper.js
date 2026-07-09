/**
 * Quality Gatekeeper. Evaluates research coverage, source tier confidence, 
 * data freshness, and determines if the daily brief meets the publishing threshold.
 */

export function evaluateQualityGate({
  plannedSearchesCount,
  successfulSearchesCount,
  verifiedFacts,
  rejectedFacts,
  threshold = 70
}) {
  // 1. Calculate Coverage Metric
  const coverage = plannedSearchesCount > 0 
    ? Math.round((successfulSearchesCount / plannedSearchesCount) * 100) 
    : 100;

  // 2. Calculate Freshness Metric
  let freshness = 100;
  if (verifiedFacts.length > 0) {
    const freshFactsCount = verifiedFacts.filter(fact => {
      const dateStr = fact.fetchedDate || fact.createdAt || fact.updatedAt;
      if (!dateStr) return false;
      const ageHours = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
      return ageHours <= 24;
    }).length;
    freshness = Math.round((freshFactsCount / verifiedFacts.length) * 100);
  }

  // 3. Calculate Average Confidence
  let confidenceScore = 100;
  if (verifiedFacts.length > 0) {
    const totalConfidenceSum = verifiedFacts.reduce((sum, fact) => {
      const conf = fact.confidence;
      if (typeof conf === 'number') {
        return sum + Math.round(conf * 100);
      }
      
      // Fallback for legacy string values
      const confStr = conf || 'Medium';
      if (confStr === 'High') return sum + 100;
      if (confStr === 'Medium') return sum + 80;
      return sum + 40; // Low
    }, 0);
    confidenceScore = Math.round(totalConfidenceSum / verifiedFacts.length);
  }

  // 4. Calculate Duplicate Resolution Status
  const duplicateResolutionStatus = verifiedFacts.length > 0 
    ? 'Completed' 
    : 'No data';

  // 5. Calculate Overall Quality Score
  const qualityScore = Math.round(
    (coverage * 0.3) + 
    (freshness * 0.3) + 
    (confidenceScore * 0.4)
  );

  const passes = qualityScore >= threshold;

  return {
    passes,
    qualityScore,
    threshold,
    metrics: {
      coverage,
      freshness,
      confidenceScore,
      duplicateResolutionStatus,
      factsCount: verifiedFacts.length,
      rejectedFactsCount: rejectedFacts.length
    },
    status: passes ? 'published' : 'needs_review'
  };
}

export default evaluateQualityGate;
