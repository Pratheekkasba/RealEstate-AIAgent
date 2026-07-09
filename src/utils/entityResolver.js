/**
 * Utility for resolving and deduplicating real estate entities (projects, builders, locations).
 * Standardizes names and groups variations using token matching and similarity analysis.
 */

// Basic Levenshtein Distance for string similarity
function LevenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // Deletion
          dp[i][j - 1] + 1,    // Insertion
          dp[i - 1][j - 1] + 1 // Substitution
        );
      }
    }
  }
  return dp[m][n];
}

// Similarity score between 0 and 1
export function getStringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const maxLength = Math.max(s1.length, s2.length);
  const distance = LevenshteinDistance(s1, s2);
  return 1 - distance / maxLength;
}

// Token-based Jaccard similarity (useful for word reordering like "VJ Yashwin" vs "Yashwin by VJ")
export function getTokenSimilarity(str1, str2) {
  const tokenize = (s) => new Set(
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !['by', 'the', 'at', 'in', 'of', 'and', 'project', 'launches', 'phase'].includes(w))
  );

  const set1 = tokenize(str1);
  const set2 = tokenize(str2);

  if (set1.size === 0 || set2.size === 0) return 0.0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Resolves a list of project records, merging duplicates based on name and locality similarity.
 */
export function resolveProjectEntities(projects) {
  const resolved = [];

  for (const item of projects) {
    let matchedIndex = -1;

    for (let i = 0; i < resolved.length; i++) {
      const existing = resolved[i];
      
      // Locality must match (or be very similar)
      const localitySim = getStringSimilarity(item.locality || '', existing.locality || '');
      if (localitySim < 0.8) continue;

      // Project name similarity check (either token similarity or Levenshtein)
      const tokenSim = getTokenSimilarity(item.projectName || '', existing.projectName || '');
      const levSim = getStringSimilarity(item.projectName || '', existing.projectName || '');
      
      if (tokenSim >= 0.5 || levSim >= 0.7) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex > -1) {
      // Merge records
      const existing = resolved[matchedIndex];
      
      // Keep the more complete builder name
      if (!existing.builder && item.builder) existing.builder = item.builder;
      else if (existing.builder && item.builder && item.builder.length > existing.builder.length) {
        existing.builder = item.builder;
      }

      // Merge sources and preserve aliases
      if (item.source && !existing.sources.includes(item.source)) {
        existing.sources.push(item.source);
      }
      if (item.projectName && !existing.aliases.includes(item.projectName)) {
        existing.aliases.push(item.projectName);
      }

      // Choose higher starting price or merge details
      if (!existing.startingPrice && item.startingPrice) existing.startingPrice = item.startingPrice;
      if (!existing.pricePerSqFt && item.pricePerSqFt) existing.pricePerSqFt = item.pricePerSqFt;

      // Add to confidence list
      existing.confidenceList.push(item.confidence || 'Medium');
    } else {
      // Create new entity
      resolved.push({
        projectName: item.projectName,
        builder: item.builder || 'Unknown',
        locality: item.locality,
        startingPrice: item.startingPrice || 'Verification unavailable',
        pricePerSqFt: item.pricePerSqFt || 'Verification unavailable',
        launchDate: item.launchDate || 'Verification unavailable',
        previousPrice: item.previousPrice || null,
        priceMovement: item.priceMovement || 'Stable',
        inventoryStatus: item.inventoryStatus || 'Unknown',
        aliases: [item.projectName],
        sources: item.source ? [item.source] : [],
        confidenceList: [item.confidence || 'Medium']
      });
    }
  }

  // Final post-processing on resolved entities
  return resolved.map(entity => {
    // Determine overall confidence based on source tiers
    const highCount = entity.confidenceList.filter(c => c === 'High').length;
    const lowCount = entity.confidenceList.filter(c => c === 'Low').length;
    let finalConfidence = 'Medium';
    if (highCount > entity.confidenceList.length / 2) finalConfidence = 'High';
    else if (lowCount > entity.confidenceList.length / 2) finalConfidence = 'Low';

    delete entity.confidenceList;

    return {
      ...entity,
      confidence: finalConfidence
    };
  });
}

export default resolveProjectEntities;
