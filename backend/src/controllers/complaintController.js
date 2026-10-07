const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const { processAndCreateComplaint } = require("../services/complaintWorkflowService");

// GET /api/complaints
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { ward, zone, category, status, search, limit = 100 } = req.query;
    const filter = {};

    if (ward) filter.ward = ward;
    if (zone) filter.zone = zone;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { address: regex },
        { issue: regex },
        { ticketId: regex },
        { phone: regex },
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate("assignedTo", "name role department zone phone email")
      .populate("duplicateOf", "ticketId issue address status priority")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(complaints);
  } catch (err) {
    next(err);
  }
};

// GET /api/complaints/:id
exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("assignedTo", "name role department zone phone email")
      .populate("duplicateOf", "ticketId issue address status priority");

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Also fetch any child complaints linked to this root complaint
    const linkedDuplicates = await Complaint.find({ duplicateOf: complaint._id })
      .select("ticketId name phone address issue priority createdAt status");

    const result = complaint.toObject();
    result.linkedDuplicates = linkedDuplicates;

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/complaints
exports.createComplaint = async (req, res, next) => {
  try {
    const complaint = await processAndCreateComplaint(
      { ...req.body, source: req.body.source || "dashboard_manual" },
      "Municipal Dashboard Staff"
    );

    console.log(`✅ [Dashboard] New complaint created: ${complaint.ticketId} (isDuplicate: ${complaint.isDuplicate})`);
    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/complaints/:id
exports.updateComplaint = async (req, res, next) => {
  try {
    const {
      status,
      assignedTo,
      notes,
      priority,
      resolutionNotes,
      resolverName,
      reworkReason,
      performedBy,
    } = req.body;
    const existing = await Complaint.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const previousState = {
      status: existing.status,
      assignedTo: existing.assignedTo,
      notes: existing.notes,
      priority: existing.priority,
    };

    const update = {};
    if (status) {
      update.status = status;
      if (status === "resolved") {
        update.resolvedAt = new Date();
        update.resolutionNotes = resolutionNotes || notes || "Resolved by Ward Engineer";
        update.resolverName = resolverName || performedBy || "Ward Engineer";
        update.reworkReason = "";
      } else if (status === "in_progress" && existing.status === "fixed") {
        update.resolvedAt = null;
        update.reworkReason = reworkReason || notes || "Rework requested by Ward Engineer";
      } else {
        update.resolvedAt = null;
      }
    }
    if (assignedTo !== undefined) update.assignedTo = assignedTo || null;
    if (notes !== undefined) update.notes = notes;
    if (priority) update.priority = priority;
    if (resolutionNotes) update.resolutionNotes = resolutionNotes;
    if (resolverName) update.resolverName = resolverName;
    if (reworkReason) update.reworkReason = reworkReason;

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate("assignedTo", "name role department zone phone email");

    // Determine audit action and performer
    const effectivePerformer = resolverName || performedBy || "Municipal Staff";
    let action = "STATUS_UPDATED";
    let auditDetails = `Updated fields: ${Object.keys(update).join(", ")}`;

    if (assignedTo !== undefined && String(assignedTo) !== String(existing.assignedTo)) {
      action = "ASSIGNED";
    } else if (status === "resolved") {
      action = "RESOLVED";
      auditDetails = `Complaint verified and approved by ${effectivePerformer}. Notes: ${update.resolutionNotes || "No remarks"}`;

      // Cascade resolution to all linked child duplicate complaints
      await Complaint.updateMany(
        { duplicateOf: updatedComplaint._id },
        {
          status: "resolved",
          resolvedAt: new Date(),
          resolutionNotes: update.resolutionNotes || "Resolved with primary ticket",
          resolverName: effectivePerformer,
        }
      );

      const childDuplicates = await Complaint.find({ duplicateOf: updatedComplaint._id }).select("_id ticketId");
      for (const child of childDuplicates) {
        await AuditLog.create({
          complaintId: child._id,
          ticketId: child.ticketId,
          action: "RESOLVED",
          performedBy: effectivePerformer,
          details: `Auto-resolved via primary ticket ${updatedComplaint.ticketId}. Sign-off: ${update.resolutionNotes || "Completed"}`,
        });
      }
    } else if (status === "in_progress" && existing.status === "fixed") {
      action = "REWORK_REQUESTED";
      auditDetails = `Rework requested by ${effectivePerformer}. Reason: ${update.reworkReason}`;
    } else if (notes && notes !== existing.notes) {
      action = "NOTE_ADDED";
    }

    await AuditLog.create({
      complaintId: updatedComplaint._id,
      ticketId: updatedComplaint.ticketId,
      action,
      performedBy: effectivePerformer,
      details: auditDetails,
      changes: {
        previous: previousState,
        updated: update,
      },
    });

    console.log(`✅ [Update] Complaint ${updatedComplaint.ticketId} updated:`, update);
    res.json(updatedComplaint);
  } catch (err) {
    next(err);
  }
};

// GET /api/complaints/track/:query (Public Citizen Tracking)
exports.trackComplaint = async (req, res, next) => {
  try {
    const rawQuery = (req.params.query || "").trim();
    if (!rawQuery) {
      return res.status(400).json({ error: "Please provide a Case ID or Phone Number." });
    }

    const cleanQuery = rawQuery.replace(/^#/, "");
    const digitsOnly = cleanQuery.replace(/[^\d]/g, "");
    
    const conditions = [
      { ticketId: cleanQuery },
      { ticketId: new RegExp(`^${cleanQuery}$`, "i") },
    ];

    if (/^\+?[\d\s-]{7,15}$/.test(cleanQuery) && digitsOnly.length >= 7) {
      conditions.push({ phone: new RegExp(digitsOnly + "$", "i") });
      conditions.push({ phone: cleanQuery });
    }

    const complaints = await Complaint.find({ $or: conditions })
      .populate("assignedTo", "name role department zone")
      .sort({ createdAt: -1 });

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({
        error: `No grievance found matching "${rawQuery}". Please verify your Case ID (e.g. VMC-2026-5739) or registered Phone Number.`,
      });
    }

    // Attach timeline history for each complaint
    const results = await Promise.all(
      complaints.map(async (c) => {
        const logs = await AuditLog.find({ complaintId: c._id })
          .sort({ timestamp: 1 })
          .select("action details timestamp performedBy");

        return {
          ...c.toObject(),
          timeline: logs,
        };
      })
    );

    res.json({
      success: true,
      count: results.length,
      complaints: results,
    });
  } catch (err) {
    next(err);
  }
};
