/**
 * GET /api/v1/suppliers
 * POST /api/v1/suppliers
 * PUT /api/v1/suppliers
 * DELETE /api/v1/suppliers
 */
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getSessionServer } from "@/utils/auth";
import { logAuditEvent, getIpAddress } from "@/lib/audit-logger";
import { withVersioning } from "@/middleware/versionMiddleware";
import logger from "@/lib/logger";

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
        const supplier = await prisma.supplier.create({ data: { name, userId } });
        await logAuditEvent({ userId, action: "CREATE", resourceType: "Supplier", resourceId: supplier.id, newValues: { name }, ipAddress, userAgent });
        return res.status(201).json(supplier);
      } catch (error) {
        logger.error("v1: Failed to create supplier", { error, userId });
        return res.status(500).json({ error: "Failed to create supplier" });
      }
    }
    case "GET": {
      try {
        const suppliers = await prisma.supplier.findMany({ where: { userId } });
        await logAuditEvent({ userId, action: "READ", resourceType: "Supplier", ipAddress, userAgent });
        return res.status(200).json(suppliers);
      } catch (error) {
        logger.error("v1: Failed to fetch suppliers", { error, userId });
        return res.status(500).json({ error: "Failed to fetch suppliers" });
      }
    }
    case "PUT": {
      try {
        const { id, name } = req.body;
        if (!id || !name) {
          return res.status(400).json({ error: "ID and name are required" });
        }
        const existing = await prisma.supplier.findUnique({ where: { id } });
        const updated = await prisma.supplier.update({ where: { id }, data: { name } });
        await logAuditEvent({ userId, action: "UPDATE", resourceType: "Supplier", resourceId: id, oldValues: existing ?? undefined, newValues: { name }, ipAddress, userAgent });
        return res.status(200).json(updated);
      } catch (error) {
        logger.error("v1: Failed to update supplier", { error, userId });
        return res.status(500).json({ error: "Failed to update supplier" });
      }
    }
    case "DELETE": {
      try {
        const { id } = req.body;
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier) {
          return res.status(404).json({ error: "Supplier not found" });
        }
        await prisma.supplier.delete({ where: { id } });
        await logAuditEvent({ userId, action: "DELETE", resourceType: "Supplier", resourceId: id, oldValues: supplier, ipAddress, userAgent });
        return res.status(204).end();
      } catch (error) {
        logger.error("v1: Failed to delete supplier", { error, userId });
        return res.status(500).json({ error: "Failed to delete supplier" });
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
