import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || "v1",
  });
}
