const AuditLog = require("../models/AuditLog");

// GET /api/audit-logs
exports.getAllAuditLogs = async (req, res, next) => {
  try {
    const { complaintId, limit = 50 } = req.query;
    const filter = {};

    if (complaintId) filter.complaintId = complaintId;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
