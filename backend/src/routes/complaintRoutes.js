const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");

router.get("/", complaintController.getAllComplaints);
router.get("/track/:query", complaintController.trackComplaint);
router.get("/:id", complaintController.getComplaintById);
router.post("/", complaintController.createComplaint);
router.patch("/:id", complaintController.updateComplaint);

module.exports = router;
