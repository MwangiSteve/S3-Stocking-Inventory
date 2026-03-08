/**
 * GET /api/v1/products
 * POST /api/v1/products
 * DELETE /api/v1/products
 *
 * Versioned products endpoint — delegates to the base handler with
 * pagination support and version headers applied via withVersioning().
 */
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { Product } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parsePaginationParams, buildPaginationResult } from "@/lib/pagination";
import { logAuditEvent, getIpAddress } from "@/lib/audit-logger";
import { withVersioning } from "@/middleware/versionMiddleware";
import logger from "@/lib/logger";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { method } = req;
  const userId = session.user.id;
  const ipAddress = getIpAddress(req as Parameters<typeof getIpAddress>[0]);
  const userAgent = req.headers["user-agent"];

  switch (method) {
    case "POST": {
      try {
        const {
          name,
          family,
          weightClass,
          size,
          buyingPrice,
          sellingPrice,
          quantity,
          lowStockAlert,
          categoryId,
          supplierId,
        } = req.body;

        if (!name || !sellingPrice || quantity === undefined || !categoryId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const productFamily =
          family ||
          (name.toLowerCase().includes("sufuria")
            ? "Sufuria Family"
            : "General Items");

        const product = await prisma.product.create({
          data: {
            name,
            family: productFamily,
            weightClass,
            size,
            buyingPrice: Number(buyingPrice || 0),
            sellingPrice: Number(sellingPrice),
            quantity: BigInt(quantity),
            lowStockAlert: Number(lowStockAlert || 5),
            status:
              Number(quantity) <= Number(lowStockAlert || 5)
                ? "LOW_STOCK"
                : "IN_STOCK",
            userId,
            categoryId,
            supplierId: supplierId || null,
            createdAt: new Date(),
          },
        });

        await logAuditEvent({
          userId,
          action: "CREATE",
          resourceType: "Product",
          resourceId: product.id,
          newValues: { name, sellingPrice, quantity, categoryId },
          ipAddress,
          userAgent,
        });

        return res.status(201).json({ ...product, quantity: Number(product.quantity) });
      } catch (error) {
        logger.error("v1: Failed to create product", { error, userId });
        return res.status(500).json({ error: "Failed to create product" });
      }
    }

    case "GET": {
      try {
        const pagination = parsePaginationParams(
          req.query as Record<string, string | string[] | undefined>
        );

        const [products, totalCount] = await Promise.all([
          prisma.product.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip: pagination.offset,
            take: pagination.limit,
          }),
          prisma.product.count({ where: { userId } }),
        ]);

        const formatted = products.map((p: Product) => ({
          ...p,
          quantity: Number(p.quantity),
          createdAt: p.createdAt.toISOString(),
        }));

        const result = buildPaginationResult(
          formatted,
          totalCount,
          pagination,
          (item) => (item as { id: string }).id
        );

        await logAuditEvent({
          userId,
          action: "READ",
          resourceType: "Product",
          ipAddress,
          userAgent,
        });

        return res.status(200).json(result);
      } catch (error) {
        logger.error("v1: Failed to fetch products", { error, userId });
        return res.status(500).json({ error: "Failed to fetch products" });
      }
    }

    case "DELETE": {
      try {
        const { id } = req.body;

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
          return res.status(404).json({ error: "Product not found" });
        }

        await prisma.product.delete({ where: { id } });

        await logAuditEvent({
          userId,
          action: "DELETE",
          resourceType: "Product",
          resourceId: id,
          oldValues: { ...existing, quantity: Number(existing.quantity) },
          ipAddress,
          userAgent,
        });

        return res.status(204).end();
      } catch (error) {
        logger.error("v1: Failed to delete product", { error, userId });
        return res.status(500).json({ error: "Failed to delete product" });
      }
    }

    default:
      res.setHeader("Allow", ["POST", "GET", "DELETE"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default withVersioning(handler);
