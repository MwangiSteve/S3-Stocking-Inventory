/**
 * Environment variable validation using Zod.
 * Import this module at the top of server-side entry points to ensure
 * all required variables are present before the app starts handling requests.
 */
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters for security"),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, "NEXTAUTH_SECRET must be at least 16 characters for security"),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_DATA_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Missing or invalid environment variables:\n${formatted}\n\n` +
        `Copy .env.example to .env.local and fill in the required values.`
    );
  }

  return result.data;
}

// Validate once at module load time (server-side only).
// The validation is skipped on the client bundle because DATABASE_URL and
// JWT_SECRET are never exposed to the browser.
let env: Env;

if (typeof window === "undefined") {
  env = validateEnv();
} else {
  // Provide safe defaults on the client so imports don't crash.
  env = {
    DATABASE_URL: "",
    JWT_SECRET: "",
    NEXTAUTH_SECRET: "",
    NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") ?? "development",
    RATE_LIMIT_AUTH_MAX: 10,
    RATE_LIMIT_DATA_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60_000,
  };
}

export { env };
