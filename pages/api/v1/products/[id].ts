import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/prisma/client";
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
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  if (req.method === "GET") {
    try {
      const product = await prisma.product.findFirst({
        where: { id, userId },
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      return res.status(200).json({
        ...(product as Product),
        quantity: Number((product as Product).quantity),
        createdAt: (product as Product).createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return res.status(500).json({ error: "Failed to fetch product" });
    }
  }

  if (req.method === "PUT") {
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
        status,
      } = req.body;

      const updatedProduct = await prisma.product.update({
        where: { id, userId },
        data: {
          ...(name !== undefined && { name }),
          ...(family !== undefined && { family }),
          ...(weightClass !== undefined && { weightClass }),
          ...(size !== undefined && { size }),
          ...(buyingPrice !== undefined && { buyingPrice: Number(buyingPrice) }),
          ...(sellingPrice !== undefined && {
            sellingPrice: Number(sellingPrice),
          }),
          ...(quantity !== undefined && { quantity: BigInt(quantity) }),
          ...(lowStockAlert !== undefined && {
            lowStockAlert: Number(lowStockAlert),
          }),
          ...(status !== undefined && { status }),
        },
      });

      return res.status(200).json({
        ...updatedProduct,
        quantity: Number(updatedProduct.quantity),
      });
    } catch (error) {
      console.error("Failed to update product:", error);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.product.delete({ where: { id, userId } });
      return res.status(204).end();
    } catch (error) {
      console.error("Failed to delete product:", error);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
