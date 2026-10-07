/**
 * Priority & SLA Management Service
 * 
 * Implements an intelligent priority classification and SLA deadline engine for
 * municipal complaints according to standard civic governance resolution benchmarks.
 */

const SLA_HOURS = {
  P1_critical: 4,  // Emergency: 4 hours
  P2_high: 12,     // High impact: 12 hours
  P3_medium: 24,   // Standard: 24 hours
  P4_low: 48,      // Routine: 48 hours
};

const CRITICAL_KEYWORDS = [
  "spark", "shock", "wire exposed", "live wire", "open wire",
  "accident", "hospital", "manhole open", "fire", "death", "danger",
  "electrocution", "short circuit", "collapse", "gas leak", "poison"
];

const HIGH_KEYWORDS = [
  "burst", "flooding", "into home", "into house", "water logging",
  "murky", "pothole", "main road", "traffic jam", "blockage",
  "sewage in street", "contaminated water", "no water in ward", "tree fallen"
];

const LOW_KEYWORDS = [
  "trimming", "pruning", "whitewash", "garden", "painting", "poster", "inquiry"
];

/**
 * Infer priority from complaint issue text and category
 */
function inferPriority(issueText = "", category = "") {
  const lower = issueText.toLowerCase();

  for (const kw of CRITICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      return "P1_critical";
    }
  }

  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) {
      return "P2_high";
    }
  }

  for (const kw of LOW_KEYWORDS) {
    if (lower.includes(kw)) {
      return "P4_low";
    }
  }

  // Category defaults
  if (category === "drainage" || category === "water_supply") {
    return "P2_high";
  }

  return "P3_medium";
}

/**
 * Calculate SLA deadline from priority
 */
function calculateSlaDeadline(priority = "P3_medium", baseDate = new Date()) {
  const hours = SLA_HOURS[priority] || SLA_HOURS.P3_medium;
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Escalate priority based on crowd-sourced duplicate count
 */
function checkPriorityEscalation(currentPriority, duplicateCount) {
  if (duplicateCount >= 6) {
    return "P1_critical";
  }
  if (duplicateCount >= 2 && (currentPriority === "P3_medium" || currentPriority === "P4_low")) {
    return "P2_high";
  }
  return currentPriority;
}

module.exports = {
  SLA_HOURS,
  inferPriority,
  calculateSlaDeadline,
  checkPriorityEscalation,
};
