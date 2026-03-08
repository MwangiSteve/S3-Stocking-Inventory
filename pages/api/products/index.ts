import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { Product } from "@prisma/client";
import { parsePaginationParams, buildPaginationResult } from "@/lib/pagination";
import logger from "@/lib/logger";



const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add API version header
  res.setHeader("X-API-Version", "1");

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { method } = req;
  const userId = session.user.id;


  switch (method) {

    // CREATE PRODUCT
    case "POST":
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
          return res.status(400).json({
            error: "Missing required fields",
          });
        }

        const productFamily =
          family || (name.toLowerCase().includes("sufuria")
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
        logger.error("Failed to create product", { error, userId });
        return res.status(500).json({ error: "Failed to create product" });
      }

    // GET PRODUCTS (with pagination)
    case "GET":
      try {
        const pagination = parsePaginationParams(req.query as Record<string, string | string[] | undefined>);

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

        return res.status(200).json(result);

      } catch (error) {
        logger.error("Failed to fetch products", { error, userId });
        return res.status(500).json({ error: "Failed to fetch products" });
      }

    // DELETE PRODUCT
    case "DELETE":
      try {
        const { id } = req.body;

        await prisma.product.delete({
          where: { id },
        });

        return res.status(204).end();

      } catch (error) {
        logger.error("Failed to delete product", { error, userId });
        return res.status(500).json({ error: "Failed to delete product" });
      }

    default:
      res.setHeader("Allow", ["POST", "GET", "DELETE"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

