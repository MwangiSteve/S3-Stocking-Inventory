/**
 * Centralized error handling utilities for Next.js API routes.
 *
 * Usage:
 *   import { handleApiError, ApiError } from "@/middleware/errorHandler";
 *
 *   export default async function handler(req, res) {
 *     try {
 *       // ... handler logic
 *     } catch (error) {
 *       handleApiError(error, res);
 *     }
 *   }
 */
import { NextApiResponse } from "next";
import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Consistent error response shape
// ---------------------------------------------------------------------------

interface ErrorResponse {
  error: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Central handler
// ---------------------------------------------------------------------------

/**
 * Maps any thrown value to a structured JSON error response.
 *
 * - `ApiError`  → uses the status code and message set by the thrower.
 * - `ZodError`  → 400 with per-field validation messages.
 * - `Error`     → 500 with the error message (detail hidden in production).
 * - unknown     → 500 "Internal server error".
 */
export function handleApiError(error: unknown, res: NextApiResponse): void {
  const isDev = process.env.NODE_ENV === "development";

  if (error instanceof ApiError) {
    const body: ErrorResponse = { error: error.message };
    if (error.details !== undefined) body.details = error.details;
    res.status(error.statusCode).json(body);
    return;
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    res.status(400).json({ error: "Validation failed", details });
    return;
  }

  if (error instanceof Error) {
    // Only expose internal error messages in development.
    const message = isDev ? error.message : "Internal server error";
    if (isDev) {
      console.error("[API Error]", error);
    } else {
      // Structured log for production log aggregators.
      console.error(
        JSON.stringify({ level: "error", message: error.message, stack: error.stack })
      );
    }
    res.status(500).json({ error: message });
    return;
  }

  console.error("[API Error] Unknown error type:", error);
  res.status(500).json({ error: "Internal server error" });
}
