import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getSessionServer } from "@/utils/auth";
import { dataRateLimit } from "@/middleware/rateLimiter";
import { handleApiError } from "@/middleware/errorHandler";
import {
  createSupplierSchema,
  updateSupplierSchema,
  deleteSupplierSchema,
} from "@/lib/validationSchemas";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionServer(req, res);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Apply moderate rate limiting to data endpoints.
  if (dataRateLimit(req, res)) return;

  const { method } = req;
  const userId = session.id;

  switch (method) {
    case "POST":
      try {
        const { name } = createSupplierSchema.parse(req.body);
        const supplier = await prisma.supplier.create({
          data: { name, userId },
        });
        res.status(201).json(supplier);
      } catch (error) {
        handleApiError(error, res);
      }
      break;
    case "GET":
      try {
        const suppliers = await prisma.supplier.findMany({
          where: { userId },
        });
        res.status(200).json(suppliers);
      } catch (error) {
        handleApiError(error, res);
      }
      break;
    case "PUT":
      try {
        const { id, name } = updateSupplierSchema.parse(req.body);

        const updatedSupplier = await prisma.supplier.update({
          where: { id },
          data: { name },
        });

        res.status(200).json(updatedSupplier);
      } catch (error) {
        handleApiError(error, res);
      }
      break;
    case "DELETE":
      try {
        const { id } = deleteSupplierSchema.parse(req.body);

        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier) {
          return res.status(404).json({ error: "Supplier not found" });
        }

        await prisma.supplier.delete({ where: { id } });
        res.status(204).end();
      } catch (error) {
        handleApiError(error, res);
      }
      break;
    default:
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};
