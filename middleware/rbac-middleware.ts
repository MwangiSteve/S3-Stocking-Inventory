import { NextApiRequest, NextApiResponse } from "next";
import { userHasPermission, Permission } from "@/lib/rbac";

export function requirePermission(permission: Permission) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ) => {
    try {
      const userId = (req as NextApiRequest & { userId?: string }).userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const hasPermission = await userHasPermission(userId, permission);
      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
}
