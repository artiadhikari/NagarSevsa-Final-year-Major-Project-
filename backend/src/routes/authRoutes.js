const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/login", authController.loginUser);
router.post("/register", authController.registerUser);
router.get("/me", protect, authController.getMe);

module.exports = router;
