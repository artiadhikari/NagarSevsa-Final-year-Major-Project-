const express = require("express");
const path = require("path");
const multer = require("multer");
const workerController = require("../controllers/workerController");
const { protect } = require("../middlewares/authMiddleware");

// Configure multer storage for after-fix proof photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/issues"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `fix-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = express.Router();

// Authentication
router.post("/login", workerController.loginWorker);

// Assigned Issues
router.get("/issues", protect, workerController.getAssignedIssues);
router.get("/complaints", protect, workerController.getAssignedIssues);

// Start work on issue (accept assignment)
router.put("/acceptAssignment", protect, workerController.acceptAssignment);
router.patch("/:id/start", protect, (req, res, next) => {
  req.body.issueId = req.params.id;
  workerController.acceptAssignment(req, res, next);
});

// Submit fix with photo
router.put("/solveIssue", protect, upload.single("afterImage"), workerController.solveIssue);
router.post("/:id/solve", protect, upload.single("afterImage"), (req, res, next) => {
  req.body.issueId = req.params.id;
  workerController.solveIssue(req, res, next);
});

module.exports = router;
