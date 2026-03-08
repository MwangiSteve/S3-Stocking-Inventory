import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { Product } from "@prisma/client";
import { dataRateLimit } from "@/middleware/rateLimiter";
import { handleApiError } from "@/middleware/errorHandler";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from "@/lib/validationSchemas";



const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Apply moderate rate limiting to data endpoints.
  if (dataRateLimit(req, res)) return;

  const { method } = req;
  const userId = session.user.id;


  switch (method) {

    // CREATE PRODUCT
    case "POST":
      try {
        const data = createProductSchema.parse(req.body);

        const productFamily =
          data.family ||
          (data.name.toLowerCase().includes("sufuria")
            ? "Sufuria Family"
            : "General Items");

        const product = await prisma.product.create({
          data: {
            name: data.name,
            family: productFamily,
            weightClass: data.weightClass,
            size: data.size,
            buyingPrice: Number(data.buyingPrice ?? 0),
            sellingPrice: Number(data.sellingPrice),
            quantity: BigInt(data.quantity),
            lowStockAlert: Number(data.lowStockAlert ?? 5),
            status:
              data.quantity <= Number(data.lowStockAlert ?? 5)
                ? "LOW_STOCK"
                : "IN_STOCK",
            userId,
            categoryId: data.categoryId,
            supplierId: data.supplierId || null,
            createdAt: new Date(),
          },
        });

        return res.status(201).json({
          ...product,
          quantity: Number(product.quantity),
        });

      } catch (error) {
        handleApiError(error, res);
      }
      break;

    // GET PRODUCTS
    case "GET":
      try {
        const products = await prisma.product.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        const formatted = products.map((p: Product) => ({
          ...p,
          quantity: Number(p.quantity),
          createdAt: p.createdAt.toISOString(),
        }));

        return res.status(200).json(formatted);

      } catch (error) {
        handleApiError(error, res);
      }
      break;

    // UPDATE PRODUCT
    case "PUT":
      try {
        const data = updateProductSchema.parse(req.body);

        const updated = await prisma.product.update({
          where: { id: data.id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.family !== undefined && { family: data.family }),
            ...(data.weightClass !== undefined && { weightClass: data.weightClass }),
            ...(data.size !== undefined && { size: data.size }),
            ...(data.buyingPrice !== undefined && { buyingPrice: Number(data.buyingPrice) }),
            ...(data.sellingPrice !== undefined && { sellingPrice: Number(data.sellingPrice) }),
            ...(data.quantity !== undefined && { quantity: BigInt(data.quantity) }),
            ...(data.lowStockAlert !== undefined && { lowStockAlert: Number(data.lowStockAlert) }),
            ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
            ...(data.supplierId !== undefined && { supplierId: data.supplierId || null }),
          },
        });

        return res.status(200).json({
          ...updated,
          quantity: Number(updated.quantity),
        });

      } catch (error) {
        handleApiError(error, res);
      }
      break;

    // DELETE PRODUCT
    case "DELETE":
      try {
        const { id } = deleteProductSchema.parse(req.body);

        await prisma.product.delete({
          where: { id },
        });

        return res.status(204).end();

      } catch (error) {
        handleApiError(error, res);
      }
      break;

    default:
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
