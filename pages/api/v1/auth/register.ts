/**
 * POST /api/v1/auth/register
 *
 * Versioned register endpoint — wraps the base register handler
 * with the X-API-Version response header.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import baseRegister from "@/pages/api/auth/register";
import { withVersioning } from "@/middleware/versionMiddleware";

export default withVersioning(baseRegister as (req: NextApiRequest, res: NextApiResponse) => Promise<void>);
