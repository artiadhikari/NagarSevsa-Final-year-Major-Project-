const express = require("express");
const router = express.Router();
const voiceController = require("../controllers/voiceController");

router.post("/", voiceController.handleIncomingCall);
router.post("/get-name", voiceController.handleGetName);
router.post("/get-address", voiceController.handleGetAddress);
router.post("/get-ward", voiceController.handleGetWard);
router.post("/get-issue", voiceController.handleGetIssue);
router.post("/confirm", voiceController.handleConfirm);

module.exports = router;
