const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["engineer", "supervisor", "field_worker"],
      required: true,
      index: true,
    },
    department: {
      type: String,
      enum: ["street_light", "water_supply", "garbage", "drainage", "road"],
      required: true,
      index: true,
    },
    zone: {
      type: String,
      enum: ["West", "East", "North", "South"],
      required: true,
      index: true,
    },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", EmployeeSchema);
