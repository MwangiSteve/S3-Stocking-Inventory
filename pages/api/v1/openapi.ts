/**
 * GET /api/v1/openapi
 *
 * Returns the OpenAPI 3.0 specification for the Stocky v1 API.
 */
import { NextApiRequest, NextApiResponse } from "next";
import { withVersioning } from "@/middleware/versionMiddleware";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Stocky Inventory API",
    version: "1.0.0",
    description: "REST API for the Stocky inventory management system.",
    contact: { name: "Stocky Support", email: "support@stockly-inventory.vercel.app" },
  },
  servers: [
    { url: "/api/v1", description: "Version 1 (current)" },
    { url: "/api", description: "Legacy (no versioning)" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "session_id" },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          family: { type: "string", nullable: true },
          weightClass: { type: "string", nullable: true },
          size: { type: "string", nullable: true },
          buyingPrice: { type: "number", nullable: true },
          sellingPrice: { type: "number" },
          quantity: { type: "number" },
          lowStockAlert: { type: "number" },
          status: { type: "string", enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] },
          createdAt: { type: "string", format: "date-time" },
          categoryId: { type: "string" },
          supplierId: { type: "string", nullable: true },
        },
      },
      PaginatedProducts: {
        type: "object",
        properties: {
          data: { type: "array", items: { "$ref": "#/components/schemas/Product" } },
          totalCount: { type: "number" },
          hasMore: { type: "boolean" },
          nextCursor: { type: "string", nullable: true },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          userId: { type: "string" },
        },
      },
      Supplier: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          userId: { type: "string" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          action: { type: "string", enum: ["CREATE", "UPDATE", "DELETE", "READ"] },
          resourceType: { type: "string" },
          resourceId: { type: "string", nullable: true },
          oldValues: { type: "string", nullable: true },
          newValues: { type: "string", nullable: true },
          ipAddress: { type: "string", nullable: true },
          userAgent: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    "/products": {
      get: {
        summary: "List products (paginated)",
        tags: ["Products"],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Paginated products list", content: { "application/json": { schema: { "$ref": "#/components/schemas/PaginatedProducts" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      post: {
        summary: "Create a product",
        tags: ["Products"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "sellingPrice", "quantity", "categoryId"],
                properties: {
                  name: { type: "string" },
                  sellingPrice: { type: "number" },
                  quantity: { type: "number" },
                  categoryId: { type: "string" },
                  buyingPrice: { type: "number" },
                  lowStockAlert: { type: "number" },
                  supplierId: { type: "string" },
                  family: { type: "string" },
                  weightClass: { type: "string" },
                  size: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Product created", content: { "application/json": { schema: { "$ref": "#/components/schemas/Product" } } } },
          "400": { description: "Validation error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        summary: "Delete a product",
        tags: ["Products"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["id"], properties: { id: { type: "string" } } } } },
        },
        responses: {
          "204": { description: "Product deleted" },
          "401": { description: "Unauthorized" },
          "404": { description: "Product not found" },
        },
      },
    },
    "/categories": {
      get: { summary: "List categories", tags: ["Categories"], responses: { "200": { description: "Categories list", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Category" } } } } } } },
      post: { summary: "Create category", tags: ["Categories"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } } } }, responses: { "201": { description: "Created" } } },
      put: { summary: "Update category", tags: ["Categories"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["id", "name"], properties: { id: { type: "string" }, name: { type: "string" } } } } } }, responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete category", tags: ["Categories"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["id"], properties: { id: { type: "string" } } } } } }, responses: { "204": { description: "Deleted" } } },
    },
    "/suppliers": {
      get: { summary: "List suppliers", tags: ["Suppliers"], responses: { "200": { description: "Suppliers list" } } },
      post: { summary: "Create supplier", tags: ["Suppliers"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } } } }, responses: { "201": { description: "Created" } } },
      put: { summary: "Update supplier", tags: ["Suppliers"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["id", "name"], properties: { id: { type: "string" }, name: { type: "string" } } } } } }, responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete supplier", tags: ["Suppliers"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["id"], properties: { id: { type: "string" } } } } } }, responses: { "204": { description: "Deleted" } } },
    },
    "/audit-logs": {
      get: {
        summary: "List audit logs (paginated)",
        tags: ["Audit Logs"],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
        ],
        responses: {
          "200": { description: "Paginated audit logs" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/roles": {
      get: { summary: "List all roles", tags: ["Roles"], responses: { "200": { description: "Roles list" } } },
      post: { summary: "Create a role", tags: ["Roles"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", enum: ["ADMIN", "MANAGER", "VIEWER"] }, description: { type: "string" } } } } } }, responses: { "201": { description: "Created" } } },
      put: { summary: "Assign role to user", tags: ["Roles"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["userId", "roleName"], properties: { userId: { type: "string" }, roleName: { type: "string" } } } } } }, responses: { "201": { description: "Role assigned" } } },
      delete: { summary: "Remove role from user", tags: ["Roles"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["userId", "roleName"], properties: { userId: { type: "string" }, roleName: { type: "string" } } } } } }, responses: { "204": { description: "Role removed" } } },
    },
    "/auth/login": {
      post: {
        summary: "Login",
        tags: ["Auth"],
        security: [],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string" } } } } } },
        responses: { "200": { description: "Login successful" }, "401": { description: "Invalid credentials" } },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register",
        tags: ["Auth"],
        security: [],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "email", "password"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 6 } } } } } },
        responses: { "201": { description: "User registered" }, "400": { description: "Validation error or user exists" } },
      },
    },
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  return res.status(200).json(openApiSpec);
}

export default withVersioning(handler);
