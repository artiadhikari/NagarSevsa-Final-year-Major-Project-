/**
 * Civic Complaint Deduplication & Clustering Engine
 * 
 * In municipal call centers, public incidents (such as a burst water pipe or blown transformer)
 * generate multiple calls from different citizens in the same ward.
 * 
 * This engine detects duplicate/clustered reports using:
 * 1. Spatial-Temporal Constraints (same Ward, same Category, within 72 hours, unresolved)
 * 2. N-Gram Dice & Token Jaccard Similarity on Issue Descriptions
 * 3. Specific Landmark & Pole Number extraction on Address Strings
 */

const Complaint = require("../models/Complaint");

const STOP_WORDS = new Set([
  "the", "is", "at", "in", "on", "near", "to", "for", "of", "and", "a", "an",
  "my", "please", "vadodara", "vmc", "ward", "area", "road", "street", "near", "behind", "opp", "opposite"
]);

/**
 * Tokenize text into normalized significant words
 */
function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Generate character n-grams (default 3-grams) for typo tolerance
 */
function getGrams(text = "", n = 3) {
  const clean = text.toLowerCase().replace(/\s+/g, "");
  const grams = new Set();
  if (clean.length < n) {
    grams.add(clean);
    return grams;
  }
  for (let i = 0; i <= clean.length - n; i++) {
    grams.add(clean.slice(i, i + n));
  }
  return grams;
}

/**
 * Calculate Jaccard Similarity on two token sets: |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculate Dice Coefficient on n-grams: 2 * |A ∩ B| / (|A| + |B|)
 */
function diceCoefficient(gramsA, gramsB) {
  if (!gramsA.size || !gramsB.size) return 0;
  let intersection = 0;
  for (const g of gramsA) {
    if (gramsB.has(g)) intersection++;
  }
  return (2 * intersection) / (gramsA.size + gramsB.size);
}

/**
 * Extract specific numeric or landmark tokens (e.g., pole numbers: "42", "pole 12")
 */
function extractLandmarks(text = "") {
  const numbers = text.match(/\d+/g) || [];
  return new Set(numbers);
}

/**
 * Compute composite similarity between two complaints
 */
function computeSimilarity(candidate, existing) {
  // 1. Issue text similarity
  const tokensIssueCandidate = tokenize(candidate.issue);
  const tokensIssueExisting = tokenize(existing.issue);
  const jaccardIssue = jaccardSimilarity(tokensIssueCandidate, tokensIssueExisting);

  const gramsIssueCandidate = getGrams(candidate.issue);
  const gramsIssueExisting = getGrams(existing.issue);
  const diceIssue = diceCoefficient(gramsIssueCandidate, gramsIssueExisting);

  const issueScore = 0.5 * jaccardIssue + 0.5 * diceIssue;

  // 2. Address similarity (token Jaccard + n-gram Dice + landmark bonus)
  const tokensAddrCandidate = tokenize(candidate.address);
  const tokensAddrExisting = tokenize(existing.address);
  const addrJaccard = jaccardSimilarity(tokensAddrCandidate, tokensAddrExisting);

  const gramsAddrCandidate = getGrams(candidate.address);
  const gramsAddrExisting = getGrams(existing.address);
  const addrDice = diceCoefficient(gramsAddrCandidate, gramsAddrExisting);
  const baseAddrScore = 0.4 * addrJaccard + 0.6 * addrDice;

  const candidateNums = extractLandmarks(candidate.address);
  const existingNums = extractLandmarks(existing.address);
  let landmarkBonus = 0;

  if (candidateNums.size > 0 && existingNums.size > 0) {
    for (const num of candidateNums) {
      if (existingNums.has(num)) {
        landmarkBonus = 0.35; // Shared pole or plot number strongly indicates same location
        break;
      }
    }
  }

  const addressScore = Math.min(1.0, baseAddrScore + landmarkBonus);

  // 3. Composite score (Address weighted 55%, Issue weighted 45%)
  const composite = 0.55 * addressScore + 0.45 * issueScore;
  return Math.round(composite * 100) / 100;
}

/**
 * Check if candidate complaint is a duplicate of any active complaint in the same ward & category
 * 
 * @param {Object} complaintData - { ward, category, address, issue }
 * @param {number} threshold - default 0.65 similarity
 * @returns {Promise<{ isDuplicate: boolean, primaryComplaint: Object|null, similarityScore: number }>}
 */
async function detectDuplicate(complaintData, threshold = 0.65) {
  const { ward, category } = complaintData;

  if (!ward || !category || category === "other") {
    return { isDuplicate: false, primaryComplaint: null, similarityScore: 0 };
  }

  // Look back up to 72 hours for open/in-progress/assigned complaints in the same ward and category
  const timeLimit = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const candidates = await Complaint.find({
    ward: String(ward).trim(),
    category,
    status: { $in: ["pending", "assigned", "in_progress"] },
    isDuplicate: false, // Match only against primary/root complaints
    createdAt: { $gte: timeLimit },
  }).sort({ createdAt: -1 });

  let bestMatch = null;
  let highestScore = 0;

  for (const existing of candidates) {
    const score = computeSimilarity(complaintData, existing);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = existing;
    }
  }

  if (highestScore >= threshold && bestMatch) {
    return {
      isDuplicate: true,
      primaryComplaint: bestMatch,
      similarityScore: highestScore,
    };
  }

  return {
    isDuplicate: false,
    primaryComplaint: null,
    similarityScore: highestScore,
  };
}

module.exports = {
  detectDuplicate,
  computeSimilarity,
  tokenize,
};
