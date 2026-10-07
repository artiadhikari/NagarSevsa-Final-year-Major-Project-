/**
 * OpenAPI 3.0 Specification for VMC Civic AI Redressal System
 */

const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "VMC AI Civic Call Center & Grievance Redressal API",
    version: "1.0.0",
    description:
      "Production-grade RESTful API documentation for Vadodara Municipal Corporation Automated AI Call Center, Incident Deduplication, Load-Balanced Dispatch, and Citizen Tracking.",
    contact: {
      name: "Vadodara Municipal Corporation IT Cell",
      email: "support@vmc.gov.in",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Complaint: {
        type: "object",
        properties: {
          ticketId: { type: "string", example: "VMC-2026-5739" },
          name: { type: "string", example: "Chetan Parmar" },
          phone: { type: "string", example: "+919876543210" },
          address: { type: "string", example: "Akota, near tube well pole 42" },
          ward: { type: "string", example: "12" },
          zone: { type: "string", enum: ["West", "East", "North", "South"], example: "West" },
          category: {
            type: "string",
            enum: ["street_light", "water_supply", "garbage", "drainage", "road", "other"],
            example: "street_light",
          },
          priority: {
            type: "string",
            enum: ["P1_critical", "P2_high", "P3_medium", "P4_low"],
            example: "P1_critical",
          },
          status: {
            type: "string",
            enum: ["pending", "assigned", "in_progress", "resolved"],
            example: "assigned",
          },
          isDuplicate: { type: "boolean", example: false },
          duplicateCount: { type: "number", example: 1 },
          autoDispatched: { type: "boolean", example: true },
          slaDeadline: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@vmc.gov.in" },
          password: { type: "string", example: "Admin@123" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5..." },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              department: { type: "string" },
              zone: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/auth/login": {
      post: {
        summary: "Officer Login & JWT Generation",
        tags: ["Authentication & RBAC"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successful login returning JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get Current Authenticated Officer Profile",
        tags: ["Authentication & RBAC"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User profile data" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/complaints": {
      get: {
        summary: "Query Complaints with Multi-Parameter Filtering",
        tags: ["Complaints Management"],
        parameters: [
          { name: "ward", in: "query", schema: { type: "string" } },
          { name: "zone", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "List of complaints",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Complaint" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create New Complaint (Triggers Deduplication & Auto-Dispatch)",
        tags: ["Complaints Management"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "address", "issue", "category", "ward"],
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  address: { type: "string" },
                  ward: { type: "string" },
                  zone: { type: "string" },
                  category: { type: "string" },
                  issue: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Complaint created and processed through workflow",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Complaint" },
              },
            },
          },
        },
      },
    },
    "/complaints/{id}": {
      get: {
        summary: "Get Complaint Details by MongoDB ID",
        tags: ["Complaints Management"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Complaint details" },
          404: { description: "Not found" },
        },
      },
      patch: {
        summary: "Update Complaint Status / Assign Staff / Add Notes",
        tags: ["Complaints Management"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["pending", "assigned", "in_progress", "resolved"] },
                  assignedTo: { type: "string" },
                  notes: { type: "string" },
                  priority: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated complaint document" },
        },
      },
    },
    "/complaints/track/{query}": {
      get: {
        summary: "Public Citizen Tracking by Case ID or Phone Number",
        tags: ["Public Citizen Redressal"],
        parameters: [
          {
            name: "query",
            in: "path",
            required: true,
            description: "Case ID (e.g. VMC-2026-5739) or 10-digit Phone Number",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Grievance status and audit activity timeline",
          },
          404: { description: "No records found" },
        },
      },
    },
    "/simulator/preset": {
      post: {
        summary: "1-Click AI IVR Call Simulation Scenario (for Viva Defense)",
        tags: ["Call Simulator & AI Telephony"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  scenarioKey: { type: "string", enum: ["streetlight", "water", "drainage", "road"] },
                  phone: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "AI extraction result and generated ticket" },
        },
      },
    },
    "/audit-logs": {
      get: {
        summary: "Query Immutable Governance Audit Trail",
        tags: ["Governance & Audit"],
        parameters: [
          { name: "complaintId", in: "query", schema: { type: "string" } },
          { name: "ticketId", in: "query", schema: { type: "string" } },
          { name: "action", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Audit trail events" },
        },
      },
    },
    "/employees": {
      get: {
        summary: "Query Active Field Staff Roster",
        tags: ["Workforce & Employee Management"],
        parameters: [
          { name: "department", in: "query", schema: { type: "string" } },
          { name: "zone", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Employee roster" },
        },
      },
    },
  },
};

function setupSwagger(app) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log("📖 Swagger API Documentation initialized at /api/docs and /docs");
}

module.exports = {
  setupSwagger,
  swaggerDocument,
};
