import { NextApiRequest, NextApiResponse } from "next";
import { getAuditLogs } from "@/lib/audit-logger";
import { addVersionHeader } from "@/middleware/api-version";
import { getSessionServer } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  addVersionHeader(res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionServer(req, res);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = session.id;
    const limit = Math.min(
      parseInt(req.query.limit as string) || 50,
      100
    );
    const offset = Math.max(
      parseInt(req.query.offset as string) || 0,
      0
    );

    const logs = await getAuditLogs(userId, limit, offset);
    return res.status(200).json({ data: logs });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
}
