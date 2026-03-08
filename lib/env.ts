import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1h"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_VERSION: z.string().default("v1"),
  ENABLE_AUDIT_LOGGING: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  ENABLE_RBAC: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
});

export const config = envSchema.parse(process.env);
