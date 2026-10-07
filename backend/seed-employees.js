require("dotenv").config();
const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("❌ MONGODB_URI is not defined in environment variables or .env");
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const Employee = require("./src/models/Employee");

    // Clear existing
    await Employee.deleteMany({});
    console.log("🗑  Cleared old employees");

    const employees = [
      // --- Engineers ---
      {
        name: "Ramesh Patel",
        role: "engineer",
        department: "street_light",
        zone: "West",
        phone: "9876543210",
        email: "ramesh.patel@vmc.gov.in",
      },
      {
        name: "Sunil Desai",
        role: "engineer",
        department: "street_light",
        zone: "East",
        phone: "9876543211",
        email: "sunil.desai@vmc.gov.in",
      },
      {
        name: "Meera Shah",
        role: "engineer",
        department: "water_supply",
        zone: "West",
        phone: "9876543212",
        email: "meera.shah@vmc.gov.in",
      },
      {
        name: "Kiran Joshi",
        role: "engineer",
        department: "water_supply",
        zone: "North",
        phone: "9876543213",
        email: "kiran.joshi@vmc.gov.in",
      },
      {
        name: "Anil Thakor",
        role: "engineer",
        department: "drainage",
        zone: "South",
        phone: "9876543214",
        email: "anil.thakor@vmc.gov.in",
      },
      {
        name: "Bhavesh Rathod",
        role: "engineer",
        department: "road",
        zone: "East",
        phone: "9876543215",
        email: "bhavesh.rathod@vmc.gov.in",
      },

      // --- Supervisors ---
      {
        name: "Priya Mehta",
        role: "supervisor",
        department: "garbage",
        zone: "West",
        phone: "9876543216",
        email: "priya.mehta@vmc.gov.in",
      },
      {
        name: "Dinesh Chauhan",
        role: "supervisor",
        department: "road",
        zone: "North",
        phone: "9876543217",
        email: "dinesh.chauhan@vmc.gov.in",
      },
      {
        name: "Geeta Vaghela",
        role: "supervisor",
        department: "drainage",
        zone: "West",
        phone: "9876543218",
        email: "geeta.vaghela@vmc.gov.in",
      },

      // --- Field Workers ---
      {
        name: "Manoj Kumar",
        role: "field_worker",
        department: "garbage",
        zone: "South",
        phone: "9876543219",
        email: "manoj.kumar@vmc.gov.in",
      },
      {
        name: "Jayesh Parmar",
        role: "field_worker",
        department: "garbage",
        zone: "East",
        phone: "9876543220",
        email: "jayesh.parmar@vmc.gov.in",
      },
      {
        name: "Sanjay Solanki",
        role: "field_worker",
        department: "street_light",
        zone: "North",
        phone: "9876543221",
        email: "sanjay.solanki@vmc.gov.in",
      },
      {
        name: "Nilesh Prajapati",
        role: "field_worker",
        department: "water_supply",
        zone: "South",
        phone: "9876543222",
        email: "nilesh.prajapati@vmc.gov.in",
      },
      {
        name: "Ravi Sharma",
        role: "field_worker",
        department: "road",
        zone: "West",
        phone: "9876543223",
        email: "ravi.sharma@vmc.gov.in",
      },
      {
        name: "Deepak Singh",
        role: "field_worker",
        department: "drainage",
        zone: "East",
        phone: "9876543224",
        email: "deepak.singh@vmc.gov.in",
      },
    ];

    await Employee.insertMany(employees);
    console.log(`✅ Seeded ${employees.length} employees`);

    // Print summary
    const engineers = employees.filter((e) => e.role === "engineer").length;
    const supervisors = employees.filter((e) => e.role === "supervisor").length;
    const workers = employees.filter((e) => e.role === "field_worker").length;
    console.log(`   Engineers: ${engineers}, Supervisors: ${supervisors}, Field Workers: ${workers}`);

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });
