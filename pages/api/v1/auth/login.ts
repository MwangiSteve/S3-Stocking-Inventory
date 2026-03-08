/**
 * POST /api/v1/auth/login
 *
 * Versioned login endpoint — wraps the base login handler
 * with the X-API-Version response header.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import baseLogin from "@/pages/api/auth/login";
import { withVersioning } from "@/middleware/versionMiddleware";

export default withVersioning(baseLogin as (req: NextApiRequest, res: NextApiResponse) => Promise<void>);
