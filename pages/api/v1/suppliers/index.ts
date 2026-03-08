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
        const suppliers = await prisma.supplier.findMany({
          where: { userId },
        });
        return res.status(200).json(suppliers);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        return res.status(500).json({ error: "Failed to fetch suppliers" });
      }

    case "POST":
      try {
        const { name } = req.body;
        const supplier = await prisma.supplier.create({
          data: { name, userId },
        });
        return res.status(201).json(supplier);
      } catch (error) {
        console.error("Error creating supplier:", error);
        return res.status(500).json({ error: "Failed to create supplier" });
      }

    case "PUT":
      try {
        const { id, name } = req.body;
        if (!id || !name) {
          return res.status(400).json({ error: "ID and name are required" });
        }
        const updatedSupplier = await prisma.supplier.update({
          where: { id, userId },
          data: { name },
        });
        return res.status(200).json(updatedSupplier);
      } catch (error) {
        console.error("Error updating supplier:", error);
        return res.status(500).json({ error: "Failed to update supplier" });
      }

    case "DELETE":
      try {
        const { id } = req.body;
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier || supplier.userId !== userId) {
          return res.status(404).json({ error: "Supplier not found" });
        }
        await prisma.supplier.delete({ where: { id } });
        return res.status(204).end();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        return res.status(500).json({ error: "Failed to delete supplier" });
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
