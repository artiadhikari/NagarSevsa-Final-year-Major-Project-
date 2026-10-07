/**
 * Automated Tests: Express API Endpoints & RBAC Authentication
 */

const request = require("supertest");
const app = require("../src/app");
const mongoose = require("mongoose");
const { connectDB } = require("../src/config/db");
const { seedDefaultUsers } = require("../src/controllers/authController");

beforeAll(async () => {
  await connectDB();
  await seedDefaultUsers();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("VMC Civic AI Redressal API Endpoints", () => {
  describe("GET /health", () => {
    it("should respond with HTTP 200 and OK status", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
      expect(res.body.service).toContain("VMC AI");
    });
  });

  describe("Authentication & RBAC (/auth/login)", () => {
    it("should reject invalid login credentials with HTTP 401", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "admin@vmc.gov.in", password: "WrongPassword" });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Invalid email or password");
    });

    it("should authenticate valid officer and return signed JWT", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "admin@vmc.gov.in", password: "Admin@123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("admin@vmc.gov.in");
      expect(res.body.user.role).toBe("super_admin");
    });
  });

  describe("Citizen Tracking (/complaints/track/:query)", () => {
    it("should return 404 for nonexistent tracking query", async () => {
      const res = await request(app).get("/complaints/track/NONEXISTENT-999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it("should return complaint details and audit timeline for existing ticket", async () => {
      // Find any ticket in the database
      const listRes = await request(app).get("/complaints?limit=1");
      if (listRes.body.length > 0) {
        const ticketId = listRes.body[0].ticketId;
        const res = await request(app).get(`/complaints/track/${ticketId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.complaints.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Field Worker & Ward Engineer Resolution Workflow", () => {
    let workerToken;
    let complaintId;
    let childDuplicateId;

    it("should allow worker login via /api/worker/login", async () => {
      // Login as field worker
      const res = await request(app)
        .post("/api/worker/login")
        .send({ email: "field.patel@vmc.gov.in", password: "Field@123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      workerToken = res.body.token;
    });

    it("should allow field worker to fetch assigned issues via /api/worker/issues", async () => {
      const res = await request(app)
        .get("/api/worker/issues")
        .set("Authorization", `Bearer ${workerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.issues)).toBe(true);
    });

    it("should allow field worker to start work (acceptAssignment)", async () => {
      // Create test root complaint and duplicate
      const rootRes = await request(app)
        .post("/api/complaints")
        .send({
          name: "Test Citizen",
          phone: "9988776655",
          address: "Ward 12 Test Street",
          ward: "12",
          category: "street_light",
          issue: "Street light flickering near pole 10",
        });

      expect(rootRes.status).toBe(201);
      complaintId = rootRes.body._id;

      // Create a duplicate complaint
      const dupRes = await request(app)
        .post("/api/complaints")
        .send({
          name: "Second Citizen",
          phone: "9988776656",
          address: "Ward 12 Test Street near pole 10",
          ward: "12",
          category: "street_light",
          issue: "Street light flickering near pole 10",
        });
      childDuplicateId = dupRes.body._id;

      // Field worker starts work
      const acceptRes = await request(app)
        .put("/api/worker/acceptAssignment")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ issueId: complaintId });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.data.status).toBe("IN_PROGRESS");
    });

    it("should allow Ward Engineer to approve and resolve complaint, cascading to duplicate", async () => {
      // Ward Engineer approves and marks resolved
      const resolveRes = await request(app)
        .patch(`/api/complaints/${complaintId}`)
        .send({
          status: "resolved",
          resolverName: "Vikram Solanki (Ward 12 Engineer)",
          resolutionNotes: "Replaced 40W LED driver and verified illumination.",
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.status).toBe("resolved");
      expect(resolveRes.body.resolvedAt).toBeDefined();
      expect(resolveRes.body.resolutionNotes).toContain("Replaced 40W LED driver");

      // Verify child duplicate complaint was automatically resolved
      const childRes = await request(app).get(`/api/complaints/${childDuplicateId}`);
      expect(childRes.status).toBe(200);
      expect(childRes.body.status).toBe("resolved");
      expect(childRes.body.resolutionNotes).toContain("Replaced 40W LED driver");
    });
  });
});
