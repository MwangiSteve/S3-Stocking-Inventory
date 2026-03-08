/**
 * GET  /api/v1/roles        - List all roles
 * POST /api/v1/roles        - Create a new role
 * PUT  /api/v1/roles        - Assign a role to a user
 * DELETE /api/v1/roles      - Remove a role from a user
 */
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { isValidRole, ROLE_PERMISSIONS } from "@/lib/rbac";
import { withVersioning } from "@/middleware/versionMiddleware";
import logger from "@/lib/logger";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { method } = req;

  switch (method) {
    case "GET": {
      try {
        const roles = await prisma.role.findMany({
          include: { userRoles: { select: { userId: true } } },
          orderBy: { name: "asc" },
        });
        return res.status(200).json(roles);
      } catch (error) {
        logger.error("v1: Failed to fetch roles", { error });
        return res.status(500).json({ error: "Failed to fetch roles" });
      }
    }

    case "POST": {
      try {
        const { name, description } = req.body;
        if (!name) {
          return res.status(400).json({ error: "Role name is required" });
        }
        if (!isValidRole(name)) {
          return res.status(400).json({
            error: `Invalid role. Must be one of: ${Object.keys(ROLE_PERMISSIONS).join(", ")}`,
          });
        }
        const existing = await prisma.role.findUnique({ where: { name } });
        if (existing) {
          return res.status(409).json({ error: "Role already exists" });
        }
        const role = await prisma.role.create({ data: { name, description } });
        return res.status(201).json(role);
      } catch (error) {
        logger.error("v1: Failed to create role", { error });
        return res.status(500).json({ error: "Failed to create role" });
      }
    }

    case "PUT": {
      try {
        const { userId, roleName } = req.body;
        if (!userId || !roleName) {
          return res.status(400).json({ error: "userId and roleName are required" });
        }
        if (!isValidRole(roleName)) {
          return res.status(400).json({ error: "Invalid role name" });
        }
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
          return res.status(404).json({ error: "Role not found. Create it first via POST." });
        }
        const existing = await prisma.userRole.findFirst({
          where: { userId, roleId: role.id },
        });
        if (existing) {
          return res.status(409).json({ error: "User already has this role" });
        }
        const userRole = await prisma.userRole.create({
          data: { userId, roleId: role.id },
        });
        return res.status(201).json(userRole);
      } catch (error) {
        logger.error("v1: Failed to assign role", { error });
        return res.status(500).json({ error: "Failed to assign role" });
      }
    }

    case "DELETE": {
      try {
        const { userId, roleName } = req.body;
        if (!userId || !roleName) {
          return res.status(400).json({ error: "userId and roleName are required" });
        }
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
          return res.status(404).json({ error: "Role not found" });
        }
        await prisma.userRole.deleteMany({
          where: { userId, roleId: role.id },
        });
        return res.status(204).end();
      } catch (error) {
        logger.error("v1: Failed to remove role assignment", { error });
        return res.status(500).json({ error: "Failed to remove role assignment" });
      }
    }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default withVersioning(handler);
