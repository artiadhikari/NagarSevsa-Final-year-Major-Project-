const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    ticketId: { type: String, default: "", index: true },
    action: {
      type: String,
      enum: [
        "CREATED",
        "STATUS_UPDATED",
        "ASSIGNED",
        "AUTO_DISPATCH",
        "CREATED_AND_DISPATCHED",
        "DUPLICATE_REGISTERED",
        "DUPLICATE_REPORT_LINKED",
        "NOTE_ADDED",
        "FIX_SUBMITTED",
        "REWORK_REQUESTED",
        "RESOLVED",
        "NOTIFICATION_SENT",
      ],
      required: true,
    },
    performedBy: { type: String, default: "System / VMC Staff" },
    details: { type: String, default: "" },
    changes: {
      previous: { type: Object, default: {} },
      updated: { type: Object, default: {} },
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
