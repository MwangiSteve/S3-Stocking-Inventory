import { NextApiRequest, NextApiResponse } from "next";
import { addVersionHeader } from "@/middleware/api-version";
import { getSessionServer } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  addVersionHeader(res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const user = await getSessionServer(req, res);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
