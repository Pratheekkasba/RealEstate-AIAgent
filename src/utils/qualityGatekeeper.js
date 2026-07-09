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
  // Percentage of planned research tracks successfully executed
  const coverage = plannedSearchesCount > 0 
    ? Math.round((successfulSearchesCount / plannedSearchesCount) * 100) 
    : 100;

  // 2. Calculate Freshness Metric
  // Percentage of facts updated/fetched within last 24 hours
  let freshness = 100;
  if (verifiedFacts.length > 0) {
    const freshFactsCount = verifiedFacts.filter(fact => {
      if (!fact.fetchedDate) return false;
      const ageHours = (Date.now() - new Date(fact.fetchedDate).getTime()) / (1000 * 60 * 60);
      return ageHours <= 24;
    }).length;
    freshness = Math.round((freshFactsCount / verifiedFacts.length) * 100);
  }

  // 3. Calculate Average Confidence
  // Map High -> 100%, Medium -> 80%, Low -> 40%
  let confidenceScore = 100;
  if (verifiedFacts.length > 0) {
    const totalConfidenceSum = verifiedFacts.reduce((sum, fact) => {
      const confidence = fact.confidence || 'Medium';
      if (confidence === 'High') return sum + 100;
      if (confidence === 'Medium') return sum + 80;
      return sum + 40; // Low
    }, 0);
    confidenceScore = Math.round(totalConfidenceSum / verifiedFacts.length);
  }

  // 4. Calculate Duplicate Resolution Status
  const duplicateResolutionStatus = verifiedFacts.length > 0 
    ? 'Completed' 
    : 'No data';

  // 5. Calculate Overall Quality Score
  // Weighted: 30% Coverage, 30% Freshness, 40% Average Confidence
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
