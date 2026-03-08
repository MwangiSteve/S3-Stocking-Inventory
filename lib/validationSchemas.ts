/**
 * Zod validation schemas for all API endpoints.
 * Import the relevant schema into each API route to validate request bodies.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128),
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  family: z.string().max(100).optional(),
  weightClass: z.string().max(50).optional(),
  size: z.string().max(50).optional(),
  buyingPrice: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().positive("Selling price must be positive"),
  quantity: z.coerce
    .number()
    .int()
    .nonnegative("Quantity must be a non-negative integer"),
  lowStockAlert: z.coerce.number().int().nonnegative().optional(),
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().optional(),
});

export const updateProductSchema = createProductSchema
  .partial()
  .extend({ id: z.string().min(1, "Product ID is required") });

export const deleteProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
});

export const updateCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required").max(100),
});

export const deleteCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
});

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(100),
});

export const updateSupplierSchema = z.object({
  id: z.string().min(1, "Supplier ID is required"),
  name: z.string().min(1, "Supplier name is required").max(100),
});

export const deleteSupplierSchema = z.object({
  id: z.string().min(1, "Supplier ID is required"),
});
