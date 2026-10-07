const path = require("path");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const { uploadToCloudinary } = require("../config/cloudinary");
const { JWT_SECRET } = require("../middlewares/authMiddleware");

function generateToken(user) {
  const cleanName = user.name ? user.name.replace(/\s*\([^)]*\)/g, "").trim() : "User";
  return jwt.sign(
    {
      id: user._id,
      name: cleanName,
      email: user.email,
      role: user.role,
      department: user.department,
      zone: user.zone,
      ward: user.ward || "12",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function mapComplaintToIssue(c) {
  const obj = c.toObject ? c.toObject() : c;
  const statusUpper = (obj.status || "assigned").toUpperCase();
  const categoryUpper = (obj.category || "other").toUpperCase();

  return {
    id: String(obj._id),
    ticketId: obj.ticketId || `VMC-2026-${String(obj._id).slice(-4)}`,
    type: categoryUpper,
    status: statusUpper === "PENDING" ? "ASSIGNED" : statusUpper,
    latitude: obj.latitude || 22.3072,
    longitude: obj.longitude || 73.1812,
    imageUrl: obj.afterImageUrl || obj.recordingUrl || "",
    afterImageUrl: obj.afterImageUrl || "",
    wardId: String(obj.ward || "12"),
    routeId: String(obj._id),
    ward: {
      id: String(obj.ward || "12"),
      name: `Ward ${obj.ward || "12"}`,
      number: Number(obj.ward) || 12,
    },
    route: {
      id: String(obj._id),
      name: obj.address || "Vadodara Location",
      wardId: String(obj.ward || "12"),
      startLat: obj.latitude || 22.3072,
      startLon: obj.longitude || 73.1812,
      endLat: obj.latitude || 22.3072,
      endLon: obj.longitude || 73.1812,
      distance: 1.2,
    },
    address: obj.address || "Vadodara",
    issue: obj.issue || "",
    priority: obj.priority || "P3_medium",
    fixNotes: obj.fixNotes || "",
    resolutionNotes: obj.resolutionNotes || "",
    resolverName: obj.resolverName || "",
    reworkReason: obj.reworkReason || "",
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
    assignedAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
  };
}

// POST /api/worker/login or /api/engineer/login
exports.loginWorker = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user);
    const cleanName = user.name ? user.name.replace(/\s*\([^)]*\)/g, "").trim() : "User";

    res.status(200).json({
      success: true,
      token,
      user: {
        id: String(user._id),
        name: cleanName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/worker/issues or /api/engineer/issues
exports.getAssignedIssues = async (req, res, next) => {
  try {
    const user = req.user;
    let filter = {};

    if (user) {
      // Find matching employee by email or name
      const matchingEmployee = await Employee.findOne({
        $or: [{ email: user.email }, { name: user.name }],
      });

      const conditions = [];
      if (matchingEmployee) {
        conditions.push({ assignedTo: matchingEmployee._id });
      }
      conditions.push({ assignedTo: user._id });

      // If user has a specific ward, include ward complaints or scoped
      if (user.ward) {
        conditions.push({ ward: user.ward });
      }

      filter = { $or: conditions };
    }

    let complaints = await Complaint.find(filter)
      .populate("assignedTo", "name role department zone phone email")
      .sort({ createdAt: -1 });

    // Fallback: If no complaints matched filter for this worker, fetch open complaints so demo is never empty
    if (complaints.length === 0) {
      complaints = await Complaint.find({ status: { $ne: "resolved" } })
        .populate("assignedTo", "name role department zone phone email")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    const issues = complaints.map(mapComplaintToIssue);
    res.status(200).json({ success: true, issues });
  } catch (err) {
    next(err);
  }
};

// PUT /api/worker/acceptAssignment or /api/engineer/acceptAssignment
exports.acceptAssignment = async (req, res, next) => {
  try {
    const { issueId } = req.body;
    if (!issueId) {
      return res.status(400).json({ success: false, message: "Missing issueId" });
    }

    const complaint = await Complaint.findById(issueId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    complaint.status = "in_progress";
    await complaint.save();

    const performer = req.user?.name || "Field Worker";
    await AuditLog.create({
      complaintId: complaint._id,
      ticketId: complaint.ticketId,
      action: "STATUS_UPDATED",
      performedBy: performer,
      details: `${performer} accepted assignment and marked task In Progress.`,
    });

    console.log(`✅ [Worker] Task ${complaint.ticketId} marked IN_PROGRESS by ${performer}`);
    res.status(200).json({
      success: true,
      data: mapComplaintToIssue(complaint),
      message: "Issue marked as In Progress",
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/worker/solveIssue or /api/engineer/solveIssue
exports.solveIssue = async (req, res, next) => {
  try {
    const { issueId, notes } = req.body;
    const file = req.file;

    if (!issueId) {
      return res.status(400).json({ success: false, message: "Missing issueId" });
    }

    const complaint = await Complaint.findById(issueId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (complaint.status === "resolved") {
      return res.status(400).json({ success: false, message: "Complaint is already resolved by Ward Engineer" });
    }

    // Upload fix proof to Cloudinary (with fallback to local storage)
    if (file) {
      const cloudUrl = await uploadToCloudinary(file.path);
      complaint.afterImageUrl = cloudUrl || `/uploads/issues/${file.filename}`;
    }

    complaint.status = "fixed";
    complaint.resolvedAt = null;
    complaint.fixNotes = notes || "Fix completed on-site. Proof photo submitted for Ward Officer inspection.";
    await complaint.save();

    const performer = req.user?.name || "Field Worker";
    await AuditLog.create({
      complaintId: complaint._id,
      ticketId: complaint.ticketId,
      action: "FIX_SUBMITTED",
      performedBy: performer,
      details: `Fix submitted with proof photo. Status set to FIXED (Awaiting Ward Officer approval). Notes: ${complaint.fixNotes}`,
    });

    console.log(`✅ [Worker] Task ${complaint.ticketId} marked FIXED by ${performer}`);
    res.status(200).json({
      success: true,
      data: mapComplaintToIssue(complaint),
      message: "Fix submitted successfully. Awaiting Ward Officer approval.",
    });
  } catch (err) {
    next(err);
  }
};
