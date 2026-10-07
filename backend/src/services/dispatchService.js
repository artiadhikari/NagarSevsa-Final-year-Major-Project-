/**
 * Smart Load-Balanced Auto-Dispatch Engine
 * 
 * Automatically assigns incoming civic complaints to active field employees
 * using a Least-Loaded / Load-Balanced dynamic assignment algorithm.
 */

const Employee = require("../models/Employee");
const Complaint = require("../models/Complaint");

/**
 * Category to Department mapping
 */
const CATEGORY_TO_DEPARTMENT = {
  street_light: "street_light",
  water_supply: "water_supply",
  garbage: "garbage",
  drainage: "drainage",
  road: "road",
  other: "road", // Default department fallback
};

/**
 * Auto-dispatch complaint to the optimal active municipal employee
 * 
 * @param {Object} complaint - { category, zone, ward }
 * @returns {Promise<{ assignedEmployee: Object|null, activeWorkload: number, rationale: string }>}
 */
async function autoDispatchComplaint(complaint) {
  const department = CATEGORY_TO_DEPARTMENT[complaint.category] || "road";
  const zone = complaint.zone || "";

  // 1. Find active employees in this department and zone
  let query = { department, active: true };
  if (zone) {
    query.zone = zone;
  }

  let candidates = await Employee.find(query);

  // Fallback: If no staff found in that exact zone, search across all zones for that department
  if (candidates.length === 0) {
    candidates = await Employee.find({ department, active: true });
  }

  // If still no staff found, search any active supervisor/engineer
  if (candidates.length === 0) {
    candidates = await Employee.find({ active: true });
  }

  if (candidates.length === 0) {
    return {
      assignedEmployee: null,
      activeWorkload: 0,
      rationale: "No active municipal staff available for auto-dispatch.",
    };
  }

  // 2. Count active unresolved assignments for each candidate
  const candidateIds = candidates.map((c) => c._id);
  const workloadCounts = await Complaint.aggregate([
    {
      $match: {
        assignedTo: { $in: candidateIds },
        status: { $in: ["assigned", "in_progress"] },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        count: { $sum: 1 },
      },
    },
  ]);

  const workloadMap = new Map();
  for (const item of workloadCounts) {
    workloadMap.set(String(item._id), item.count);
  }

  // 3. Select employee with minimum active workload
  let bestCandidate = candidates[0];
  let minWorkload = workloadMap.get(String(bestCandidate._id)) || 0;

  for (const candidate of candidates) {
    const workload = workloadMap.get(String(candidate._id)) || 0;
    if (workload < minWorkload) {
      minWorkload = workload;
      bestCandidate = candidate;
    }
  }

  return {
    assignedEmployee: bestCandidate,
    activeWorkload: minWorkload,
    rationale: `Auto-assigned to ${bestCandidate.name} (${bestCandidate.role}, ${bestCandidate.department}) based on least active workload (${minWorkload} active items in ${bestCandidate.zone || "Vadodara"} zone).`,
  };
}

module.exports = {
  autoDispatchComplaint,
  CATEGORY_TO_DEPARTMENT,
};
