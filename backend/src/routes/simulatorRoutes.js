const express = require("express");
const router = express.Router();
const simulatorController = require("../controllers/simulatorController");

router.post("/scenario", simulatorController.runDemoScenario);
router.post("/turn", simulatorController.runInteractiveTurn);

module.exports = router;
