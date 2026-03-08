/**
 * GET /api/v1/categories
 * POST /api/v1/categories
 * PUT /api/v1/categories
 * DELETE /api/v1/categories
 */
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getSessionServer } from "@/utils/auth";
import { logAuditEvent, getIpAddress } from "@/lib/audit-logger";
import { withVersioning } from "@/middleware/versionMiddleware";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSessionServer(req, res);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { method } = req;
  const userId = session.id;
  const ipAddress = getIpAddress(req as Parameters<typeof getIpAddress>[0]);
  const userAgent = req.headers["user-agent"];

  switch (method) {
    case "POST": {
      try {
        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ error: "Name is required" });
        }
        const category = await prisma.category.create({ data: { name, userId } });
        await logAuditEvent({ userId, action: "CREATE", resourceType: "Category", resourceId: category.id, newValues: { name }, ipAddress, userAgent });
        return res.status(201).json(category);
      } catch (error) {
        logger.error("v1: Failed to create category", { error, userId });
        return res.status(500).json({ error: "Failed to create category" });
      }
    }
    case "GET": {
      try {
        const categories = await prisma.category.findMany({ where: { userId } });
        await logAuditEvent({ userId, action: "READ", resourceType: "Category", ipAddress, userAgent });
        return res.status(200).json(categories);
      } catch (error) {
        logger.error("v1: Failed to fetch categories", { error, userId });
        return res.status(500).json({ error: "Failed to fetch categories" });
      }
    }
    case "PUT": {
      try {
        const { id, name } = req.body;
        if (!id || !name) {
          return res.status(400).json({ error: "ID and name are required" });
        }
        const existing = await prisma.category.findUnique({ where: { id } });
        const updated = await prisma.category.update({ where: { id }, data: { name } });
        await logAuditEvent({ userId, action: "UPDATE", resourceType: "Category", resourceId: id, oldValues: existing ?? undefined, newValues: { name }, ipAddress, userAgent });
        return res.status(200).json(updated);
      } catch (error) {
        logger.error("v1: Failed to update category", { error, userId });
        return res.status(500).json({ error: "Failed to update category" });
      }
    }
    case "DELETE": {
      try {
        const { id } = req.body;
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
        await prisma.category.delete({ where: { id } });
        await logAuditEvent({ userId, action: "DELETE", resourceType: "Category", resourceId: id, oldValues: category, ipAddress, userAgent });
        return res.status(204).end();
      } catch (error) {
        logger.error("v1: Failed to delete category", { error, userId });
        return res.status(500).json({ error: "Failed to delete category" });
      }
    }
    default:
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default withVersioning(handler);

export const config = {
  api: { externalResolver: true },
};
