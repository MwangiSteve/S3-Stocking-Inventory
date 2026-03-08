import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getSessionServer } from "@/utils/auth";
import { dataRateLimit } from "@/middleware/rateLimiter";
import { handleApiError } from "@/middleware/errorHandler";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
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
        const { name } = createCategorySchema.parse(req.body);
        const category = await prisma.category.create({
          data: { name, userId },
        });
        res.status(201).json(category);
      } catch (error) {
        handleApiError(error, res);
      }
      break;
    case "GET":
      try {
        const categories = await prisma.category.findMany({
          where: { userId },
        });
        res.status(200).json(categories);
      } catch (error) {
        handleApiError(error, res);
      }
      break;
    case "PUT":
      try {
        const { id, name } = updateCategorySchema.parse(req.body);

        const updatedCategory = await prisma.category.update({
          where: { id },
          data: { name },
        });

        res.status(200).json(updatedCategory);
      } catch (error) {
        handleApiError(error, res);
      }
      break;
    case "DELETE":
      try {
        const { id } = deleteCategorySchema.parse(req.body);

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }

        await prisma.category.delete({ where: { id } });
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
