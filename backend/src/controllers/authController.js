const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middlewares/authMiddleware");

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      zone: user.zone,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please provide email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        zone: user.zone,
        ward: user.ward || (user.role === "ward_officer" || user.role === "ward_engineer" ? "12" : undefined),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, zone, ward } = req.body;

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "ward_officer",
      department: department || "all",
      zone: zone || "All",
      ward: ward || "",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        zone: user.zone,
        ward: user.ward || (user.role === "ward_officer" || user.role === "ward_engineer" ? "12" : undefined),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      ...user.toObject(),
      ward: user.ward || (user.role === "ward_officer" || user.role === "ward_engineer" ? "12" : undefined),
    },
  });
};

// Initialize / seed default municipal demo users if none exist
exports.seedDefaultUsers = async () => {
  try {
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
      console.log("🌱 Seeding default municipal officers...");

      await User.create([
        {
          name: "Dr. Vikram Seth (Municipal Commissioner)",
          email: "admin@vmc.gov.in",
          password: "Admin@123",
          role: "super_admin",
          department: "all",
          zone: "All",
        },
        {
          name: "Sanjay Dave (Ward 12 Officer)",
          email: "ward.west@vmc.gov.in",
          password: "Officer@123",
          role: "ward_officer",
          department: "street_light",
          zone: "West",
          ward: "12",
        },
        {
          name: "Vikram Solanki (Ward 12 Engineer)",
          email: "engineer.west@vmc.gov.in",
          password: "Engineer@123",
          role: "ward_engineer",
          department: "street_light",
          zone: "West",
          ward: "12",
        },
        {
          name: "Ramesh Patel",
          email: "field.patel@vmc.gov.in",
          password: "Field@123",
          role: "field_worker",
          department: "street_light",
          zone: "West",
          ward: "12",
        },
      ]);

      console.log("✅ Default municipal demo accounts created successfully!");
    } else {
      // Ensure existing demo ward officer has ward: "12"
      await User.updateOne(
        { email: "ward.west@vmc.gov.in" },
        { $set: { ward: "12", name: "Sanjay Dave (Ward 12 Officer)" } }
      );

      // Ensure Ward 12 Engineer exists
      const engineerExists = await User.findOne({ email: "engineer.west@vmc.gov.in" });
      if (!engineerExists) {
        await User.create({
          name: "Vikram Solanki (Ward 12 Engineer)",
          email: "engineer.west@vmc.gov.in",
          password: "Engineer@123",
          role: "ward_engineer",
          department: "street_light",
          zone: "West",
          ward: "12",
        });
      }

      // Ensure Field Worker demo exists with clean name (no title)
      const workerExists = await User.findOne({ email: "field.patel@vmc.gov.in" });
      if (!workerExists) {
        await User.create({
          name: "Ramesh Patel",
          email: "field.patel@vmc.gov.in",
          password: "Field@123",
          role: "field_worker",
          department: "street_light",
          zone: "West",
          ward: "12",
        });
      } else {
        await User.updateOne(
          { email: "field.patel@vmc.gov.in" },
          { $set: { name: "Ramesh Patel" } }
        );
      }
    }
  } catch (err) {
    console.error("Error seeding default users:", err.message);
  }
};
