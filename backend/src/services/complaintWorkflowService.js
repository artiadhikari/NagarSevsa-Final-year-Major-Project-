/**
 * Unified Civic Complaint Workflow Coordinator
 * 
 * Orchestrates:
 * 1. SLA Deadline & Priority Classification
 * 2. Spatial-Temporal Deduplication & Incident Clustering
 * 3. Dynamic Least-Loaded Auto-Dispatch
 * 4. Comprehensive Audit Trail Generation
 */

const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const { inferPriority, calculateSlaDeadline, checkPriorityEscalation } = require("./priorityService");
const { detectDuplicate } = require("./deduplicationService");
const { autoDispatchComplaint } = require("./dispatchService");
const { sendRegistrationNotifications } = require("./notificationService");

/**
 * Ingest and process a new complaint across all entry channels
 * (Twilio IVR Call, Web Simulator, or Dashboard Form)
 * 
 * @param {Object} rawData - Incoming complaint attributes
 * @param {string} performer - "AI IVR Telephony", "Dashboard Staff", or "Call Simulator"
 * @returns {Promise<Object>} Saved and populated Complaint document
 */
async function processAndCreateComplaint(rawData, performer = "VMC AI Telephony System") {
  const data = { ...rawData };

  // 1. Ensure Ticket ID
  if (!data.ticketId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    data.ticketId = `VMC-2026-${randomSuffix}`;
  }

  // 2. Priority & SLA Calculation
  if (!data.priority) {
    data.priority = inferPriority(data.issue || "", data.category || "other");
  }
  data.slaDeadline = calculateSlaDeadline(data.priority);

  // 3. Deduplication Check
  const dupResult = await detectDuplicate(data);

  let auditAction = "CREATED";
  let auditDetails = `Complaint registered via ${data.source || "system"}`;

  if (dupResult.isDuplicate && dupResult.primaryComplaint) {
    const primary = dupResult.primaryComplaint;

    data.isDuplicate = true;
    data.duplicateOf = primary._id;
    data.similarityScore = dupResult.similarityScore;
    data.status = primary.status;
    data.assignedTo = primary.assignedTo;

    // Update parent ticket statistics
    primary.duplicateCount = (primary.duplicateCount || 0) + 1;

    // Check for crowd-sourced priority escalation
    const newPriority = checkPriorityEscalation(primary.priority, primary.duplicateCount);
    const priorityChanged = newPriority !== primary.priority;
    if (priorityChanged) {
      primary.priority = newPriority;
      primary.slaDeadline = calculateSlaDeadline(newPriority, primary.createdAt);
    }

    // Append caller phone to parent if unique
    if (data.phone) {
      const alreadyLinked = primary.linkedCallers?.some((c) => c.phone === data.phone);
      if (!alreadyLinked) {
        primary.linkedCallers.push({ phone: data.phone, reportedAt: new Date() });
      }
    }

    await primary.save();

    // Log escalation on primary ticket
    await AuditLog.create({
      complaintId: primary._id,
      ticketId: primary.ticketId,
      action: "DUPLICATE_REPORT_LINKED",
      performedBy: performer,
      details: `Additional report linked (Ticket: ${data.ticketId}, Similarity: ${Math.round(
        dupResult.similarityScore * 100
      )}%). Duplicate count: ${primary.duplicateCount}.${
        priorityChanged ? ` Urgency auto-escalated to ${primary.priority}.` : ""
      }`,
    });

    auditAction = "DUPLICATE_REGISTERED";
    auditDetails = `Linked to primary ticket ${primary.ticketId} with ${Math.round(
      dupResult.similarityScore * 100
    )}% similarity.`;
  } else {
    // 4. Smart Load-Balanced Auto-Dispatch
    const dispatchResult = await autoDispatchComplaint(data);
    if (dispatchResult.assignedEmployee) {
      data.assignedTo = dispatchResult.assignedEmployee._id;
      data.autoDispatched = true;
      data.status = "assigned";
      auditAction = "CREATED_AND_DISPATCHED";
      auditDetails = dispatchResult.rationale;
    }
  }

  // 5. Persist the new complaint
  const complaint = await Complaint.create(data);

  // 6. Generate initial immutable Audit Trail
  await AuditLog.create({
    complaintId: complaint._id,
    ticketId: complaint.ticketId,
    action: auditAction,
    performedBy: performer,
    details: auditDetails,
    changes: {
      initial: {
        priority: complaint.priority,
        category: complaint.category,
        ward: complaint.ward,
        status: complaint.status,
        assignedTo: complaint.assignedTo,
        isDuplicate: complaint.isDuplicate,
      },
    },
  });

  // Populate references for return
  const populated = await Complaint.findById(complaint._id)
    .populate("assignedTo", "name role department zone phone email")
    .populate("duplicateOf", "ticketId issue address status priority");

  // 7. Dispatch automated notifications (SMS & Email) with assigned officer and track link
  sendRegistrationNotifications(populated).catch((err) => {
    console.error("Failed to send registration notifications:", err);
  });

  return populated;
}

module.exports = {
  processAndCreateComplaint,
};
