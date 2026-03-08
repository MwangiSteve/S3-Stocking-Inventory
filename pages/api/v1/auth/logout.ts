import { NextApiRequest, NextApiResponse } from "next";
import { addVersionHeader } from "@/middleware/api-version";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  addVersionHeader(res);

  res.setHeader("Set-Cookie", "session_id=; HttpOnly; Path=/; Max-Age=0");
  return res.status(204).end();
}
