import swaggerUi from "swagger-ui-express";

// Define OpenAPI spec directly (no file reading needed - works on Vercel)
const specs = {
  openapi: "3.0.0",
  info: {
    title: "User Management API",
    version: "2.0.0",
    description: `
# REST API 🚀

Manage user accounts with simple, secure endpoints.

## Authentication 🔐

Register → Login → Get Token → Include in requests

For protected endpoints, use the **Authorize** button and enter:
\`\`\`
Bearer <your-token>
\`\`\`

## Endpoints Summary

| Method | Path | Auth |
|--------|------|------|
| GET | \`/\` | No |
| GET | \`/ping\` | No |
| GET | \`/health\` | No |
| POST | \`/login\` | No |
| POST | \`/api/users\` | No (Registration) |
| GET | \`/api/users\` | **Yes** |
| GET | \`/api/users/:id\` | **Yes** |
| PUT | \`/api/users/:id\` | **Yes** |
| DELETE | \`/api/users/:id\` | **Yes** |
| POST | \`/logout\` | **Yes** |
    `,
    contact: {
      name: "Support",
      email: "support@service.io"
    },
    license: {
      name: "Apache 2.0"
    }
  },
  servers: [
    {
      url: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://api.yourdomain.com",
      description: "🌐 Production Server (Vercel)",
    },
    {
      url: "http://localhost:3000",
      description: "🖥️ Development Server",
    }
  ],
  tags: [
    { name: "Health", description: "🏥 **Status Check** — Monitor server connectivity" },
    { name: "Authentication", description: "🔐 **Auth** — Login & Logout sessions" },
    { name: "Users", description: "👥 **User Management** — CRUD for user accounts" },
    { name: "Misc", description: "🔧 **Utility** — Extra endpoints" },
  ],
  paths: {
    // --- Health Group ---
    "/": {
      get: {
        tags: ["Health"],
        summary: "Root endpoint",
        responses: { 200: { description: "OK", content: { "text/plain": { schema: { type: "string", example: "✅ Server is running..." } } } } }
      }
    },
    "/ping": {
      get: {
        tags: ["Health"],
        summary: "Database connection test",
        responses: {
          200: { description: "Successful", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, time: { type: "string" } } } } } },
          500: { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "API health check",
        responses: { 200: { description: "Operational" } }
      }
    },

    // --- Authentication Group ---
    "/api/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } }
        },
        responses: {
          200: { description: "Login success", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/api/logout": {
      post: {
        tags: ["Authentication"],
        summary: "User logout",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Logged out successfully" } }
      }
    },

    // --- Users Group (Prefix with /api) ---
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users (Paginated)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } }
        ],
        responses: {
          200: { description: "List of users", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, count: { type: "integer" }, data: { type: "array", items: { $ref: "#/components/schemas/User" } } } } } } },
          401: { $ref: "#/components/responses/Unauthorized" }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Register new user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserInput" } } }
        },
        responses: { 201: { description: "Created" }, 400: { description: "Bad Request" } }
      }
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { properties: { status: { type: "string" }, data: { $ref: "#/components/schemas/User" } } } } } },
          404: { $ref: "#/components/responses/NotFound" }
        }
      },
      put: {
        tags: ["Users"],
        summary: "Update user data",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { firstname: { type: "string" }, lastname: { type: "string" }, status: { type: "string" } } } } }
        },
        responses: { 200: { description: "Updated" } }
      },
      delete: {
        tags: ["Users"],
        summary: "Remove user",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Deleted" } }
      }
    },

    // --- Misc Group ---
    "/api/data": {
      get: {
        tags: ["Misc"],
        summary: "Test CORS configuration",
        responses: { 200: { description: "CORS OK" } }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "กรอกแค่ Token ที่ได้รับจากการ Login เท่านั้น (ไม่ต้องพิมพ์คำว่า Bearer นำหน้า)"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          firstname: { type: "string", example: "John" },
          fullname: { type: "string", example: "John Doe" },
          lastname: { type: "string", example: "Doe" },
          username: { type: "string", example: "johndoe" },
          status: { type: "string", example: "active", enum: ["active", "inactive"] },
          created_at: { type: "string", format: "date-time" }
        }
      },
      UserInput: {
        type: "object",
        required: ["firstname", "fullname", "lastname", "username", "password"],
        properties: {
          firstname: { type: "string" },
          fullname: { type: "string" },
          lastname: { type: "string" },
          username: { type: "string" },
          password: { type: "string" },
          status: { type: "string", default: "active" }
        }
      },
      LoginInput: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "johndoe" },
          password: { type: "string", example: "password123" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string" }
        }
      }
    },
    responses: {
      Unauthorized: { description: "🔒 Access Denied: No or Invalid Token" },
      NotFound: { description: "🔍 Error: Resource Not Found" },
      ServerError: { description: "💥 Error: Internal Server Error" }
    }
  }
};

export { swaggerUi, specs };