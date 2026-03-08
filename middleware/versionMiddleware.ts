import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

const CURRENT_API_VERSION = "1";

/**
 * Wraps an API handler with version headers and common middleware.
 * All v1 endpoints should use this wrapper.
 */
export function withVersioning(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader("X-API-Version", CURRENT_API_VERSION);
    res.setHeader("X-Supported-Versions", "1");
    return handler(req, res);
  };
}
