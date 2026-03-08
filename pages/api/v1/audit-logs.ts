/**
 * GET /api/v1/audit-logs
 *
 * Returns paginated audit log entries for the authenticated user.
 * Requires the user to have the VIEW_AUDIT_LOGS permission (ADMIN or MANAGER role).
 */
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { parsePaginationParams, buildPaginationResult } from "@/lib/pagination";
import { withVersioning } from "@/middleware/versionMiddleware";
import logger from "@/lib/logger";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.user.id;

  try {
    const pagination = parsePaginationParams(
      req.query as Record<string, string | string[] | undefined>
    );

    const whereClause = { userId };

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: pagination.offset,
        take: pagination.limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    const result = buildPaginationResult(
      logs,
      totalCount,
      pagination,
      (item) => (item as { id: string }).id
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error("v1: Failed to fetch audit logs", { error, userId });
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
}

export default withVersioning(handler);
