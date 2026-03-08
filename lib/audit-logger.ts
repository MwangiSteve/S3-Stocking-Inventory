import { prisma } from "@/prisma/client";

export interface AuditLogInput {
  userId: string;
  actionType: "CREATE" | "UPDATE" | "DELETE" | "READ";
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        actionType: input.actionType,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        changes: input.changes,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    console.error("Audit logging failed:", error);
    // Don't throw - audit logging failure shouldn't break the app
  }
}

export async function getAuditLogs(
  userId: string,
  limit = 50,
  offset = 0
) {
  return prisma.auditLog.findMany({
    where: { userId },
    skip: offset,
    take: limit,
    orderBy: { timestamp: "desc" },
  });
}
