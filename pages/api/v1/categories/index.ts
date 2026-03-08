import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/prisma/client";
import { addVersionHeader } from "@/middleware/api-version";
import { getSessionServer } from "@/utils/auth";

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

  switch (req.method) {
    case "GET":
      try {
        const categories = await prisma.category.findMany({
          where: { userId },
        });
        return res.status(200).json(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ error: "Failed to fetch categories" });
      }

    case "POST":
      try {
        const { name } = req.body;
        const category = await prisma.category.create({
          data: { name, userId },
        });
        return res.status(201).json(category);
      } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({ error: "Failed to create category" });
      }

    case "PUT":
      try {
        const { id, name } = req.body;
        if (!id || !name) {
          return res.status(400).json({ error: "ID and name are required" });
        }
        const updatedCategory = await prisma.category.update({
          where: { id, userId },
          data: { name },
        });
        return res.status(200).json(updatedCategory);
      } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ error: "Failed to update category" });
      }

    case "DELETE":
      try {
        const { id } = req.body;
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category || category.userId !== userId) {
          return res.status(404).json({ error: "Category not found" });
        }
        await prisma.category.delete({ where: { id } });
        return res.status(204).end();
      } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({ error: "Failed to delete category" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};
