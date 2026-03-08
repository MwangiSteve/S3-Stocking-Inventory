import { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { dataRateLimit } from "@/middleware/rateLimiter";
import { handleApiError } from "@/middleware/errorHandler";
import { z } from "zod";

/** Shape of each product row sent from the client. */
const productRowSchema = z.object({
  name: z.string(),
  family: z.string().optional(),
  weightClass: z.string().optional(),
  size: z.string().optional(),
  buyingPrice: z.number().optional(),
  sellingPrice: z.number().optional(),
  quantity: z.number(),
  status: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  createdAt: z.string(),
});

const exportBodySchema = z.object({
  products: z.array(productRowSchema).min(1, "At least one product is required"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (dataRateLimit(req, res)) return;

  try {
    const { products } = exportBodySchema.parse(req.body);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Stockly";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Products");

    worksheet.columns = [
      { header: "Product Name",  key: "name",         width: 22 },
      { header: "Family",        key: "family",        width: 14 },
      { header: "Weight Class",  key: "weightClass",   width: 14 },
      { header: "Size",          key: "size",          width: 10 },
      { header: "Buying Price",  key: "buyingPrice",   width: 14 },
      { header: "Selling Price", key: "sellingPrice",  width: 14 },
      { header: "Quantity",      key: "quantity",      width: 10 },
      { header: "Status",        key: "status",        width: 14 },
      { header: "Category",      key: "category",      width: 16 },
      { header: "Supplier",      key: "supplier",      width: 16 },
      { header: "Created Date",  key: "createdAt",     width: 14 },
    ];

    // Style the header row.
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Populate data rows.
    products.forEach((product) => {
      worksheet.addRow({
        name:         product.name,
        family:       product.family      ?? "N/A",
        weightClass:  product.weightClass ?? "N/A",
        size:         product.size        ?? "N/A",
        buyingPrice:  product.buyingPrice  ?? 0,
        sellingPrice: product.sellingPrice ?? 0,
        quantity:     product.quantity,
        status:       product.status      ?? "N/A",
        category:     product.category    ?? "Unknown",
        supplier:     product.supplier    ?? "Unknown",
        createdAt:    new Date(product.createdAt).toLocaleDateString("en-US"),
      });
    });

    // Format price columns as currency.
    worksheet.getColumn("buyingPrice").numFmt  = '"$"#,##0.00';
    worksheet.getColumn("sellingPrice").numFmt = '"$"#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();

    const date = new Date().toISOString().split("T")[0];
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="stockly-products-${date}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.byteLength);

    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    handleApiError(error, res);
  }
}
