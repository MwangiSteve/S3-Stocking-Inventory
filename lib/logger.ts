import winston from "winston";
import path from "path";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
  return `${timestamp} [${level}]: ${stack || message} ${metaStr}`.trim();
});

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize({ all: !isProduction }),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      errors({ stack: true }),
      logFormat
    ),
    silent: process.env.NODE_ENV === "test",
  }),
];

if (isProduction || isDevelopment) {
  const logsDir = path.join(process.cwd(), "logs");

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: combine(timestamp(), errors({ stack: true })),
  transports,
  exitOnError: false,
});

export default logger;
