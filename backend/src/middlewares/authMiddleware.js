const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "vmc_major_project_secret_key_2026";

// Protect routes requiring authentication
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      error: {
        message: "Not authorized to access this resource. Please log in.",
        status: 401,
      },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.active) {
      return res.status(401).json({
        error: {
          message: "User session expired or user is deactivated.",
          status: 401,
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({
      error: {
        message: "Invalid or expired token. Please log in again.",
        status: 401,
      },
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: `Forbidden: User role '${req.user?.role}' is not authorized to perform this action.`,
          status: 403,
        },
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  JWT_SECRET,
};
