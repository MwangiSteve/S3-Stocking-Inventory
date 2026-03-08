import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@/lib/logger";

export function requestLogger(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const startTime = Date.now();

  const originalSend = res.send.bind(res);
  res.send = function (data) {
    const duration = Date.now() - startTime;

    logger.info({
      method: req.method,
      path: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as NextApiRequest & { userId?: string }).userId,
    });

    return originalSend(data);
  };

  next();
}
