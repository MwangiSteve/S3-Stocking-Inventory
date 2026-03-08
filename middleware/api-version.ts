import { NextApiResponse } from "next";

export function addVersionHeader(
  res: NextApiResponse,
  version: string = "v1"
) {
  res.setHeader("API-Version", version);
  res.setHeader("Deprecation", version === "v1" ? "false" : "true");
}
