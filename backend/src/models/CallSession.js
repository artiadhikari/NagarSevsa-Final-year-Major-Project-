const mongoose = require("mongoose");

const CallSessionSchema = new mongoose.Schema({
  callSid: { type: String, required: true, unique: true, index: true },
  phone: { type: String, default: "" },
  step: {
    type: String,
    enum: ["init", "name", "address", "ward", "issue", "confirm"],
    default: "init",
  },
  name: { type: String, default: "" },
  address: { type: String, default: "" },
  ward: { type: String, default: "" },
  issue: { type: String, default: "" },
  category: { type: String, default: "" },
  zone: { type: String, default: "" },
  extractedData: { type: Object, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // MongoDB TTL index: automatically deletes document after 15 minutes (900 seconds)
  },
});

module.exports = mongoose.model("CallSession", CallSessionSchema);
