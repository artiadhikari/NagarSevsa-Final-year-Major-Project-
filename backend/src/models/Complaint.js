const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true },
    name: { type: String, default: "Anonymous Citizen" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    ward: { type: String, default: "", index: true },
    issue: { type: String, default: "" },
    category: {
      type: String,
      enum: ["street_light", "water_supply", "garbage", "drainage", "road", "other"],
      default: "other",
      index: true,
    },
    zone: {
      type: String,
      enum: ["West", "East", "North", "South", ""],
      default: "",
    },
    priority: {
      type: String,
      enum: ["P1_critical", "P2_high", "P3_medium", "P4_low"],
      default: "P3_medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "fixed", "resolved"],
      default: "pending",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    autoDispatched: { type: Boolean, default: false },
    slaDeadline: { type: Date, default: null, index: true },
    isDuplicate: { type: Boolean, default: false, index: true },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },
    duplicateCount: { type: Number, default: 0 },
    similarityScore: { type: Number, default: 0 },
    linkedCallers: [
      {
        phone: { type: String, default: "" },
        reportedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, default: "" },
    recordingUrl: { type: String, default: "" },
    afterImageUrl: { type: String, default: "" },
    fixNotes: { type: String, default: "" },
    resolverName: { type: String, default: "" },
    resolutionNotes: { type: String, default: "" },
    reworkReason: { type: String, default: "" },
    latitude: { type: Number, default: 22.3072 },
    longitude: { type: Number, default: 73.1812 },
    source: {
      type: String,
      enum: ["ivr_phone", "dashboard_manual", "call_simulator"],
      default: "ivr_phone",
    },
    createdAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Auto-generate ticketId before save if missing
ComplaintSchema.pre("save", function () {
  if (!this.ticketId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `VMC-2026-${randomSuffix}`;
  }
});

module.exports = mongoose.model("Complaint", ComplaintSchema);
