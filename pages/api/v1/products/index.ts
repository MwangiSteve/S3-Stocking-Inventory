import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/prisma/client";
import { validatePaginationParams } from "@/lib/pagination";
import { addVersionHeader } from "@/middleware/api-version";
import { getSessionServer } from "@/utils/auth";
import { Product } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  addVersionHeader(res);

  const session = await getSessionServer(req, res);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.id;

  if (req.method === "GET") {
    try {
      const { limit, offset } = validatePaginationParams(
        parseInt(req.query.limit as string),
        parseInt(req.query.offset as string)
      );

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { userId },
          skip: offset,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where: { userId } }),
      ]);

      const formatted = products.map((p: Product) => ({
        ...p,
        quantity: Number(p.quantity),
        createdAt: p.createdAt.toISOString(),
      }));

      return res.status(200).json({
        data: formatted,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
          pageCount: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  if (req.method === "POST") {
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

      return res.status(201).json({
        ...product,
        quantity: Number(product.quantity),
      });
    } catch (error) {
      console.error("Failed to create product:", error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      await prisma.product.delete({ where: { id, userId } });
      return res.status(204).end();
    } catch (error) {
      console.error("Failed to delete product:", error);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
