import logger from "./logger";
import prisma from "./prisma";

export type ActionType = "CREATE" | "UPDATE" | "DELETE" | "READ";

export interface AuditLogEntry {
  userId: string;
  action: ActionType;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit entry to the database and to the structured logger.
 * If the database write fails, the error is logged but not re-thrown
 * so that audit failures never block the main request.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const logPayload = {
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
  };

  logger.info("AUDIT", logPayload);

  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (error) {
    logger.error("Failed to persist audit log entry", { error, entry: logPayload });
  }
}

/**
 * Extract IP address from a Next.js API request.
 */
export function getIpAddress(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  }
  return req.socket?.remoteAddress;
}
