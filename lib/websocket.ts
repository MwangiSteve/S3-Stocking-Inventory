import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "./logger";

export interface InventoryUpdatePayload {
  type: "PRODUCT_CREATED" | "PRODUCT_UPDATED" | "PRODUCT_DELETED";
  productId: string;
  userId: string;
  data?: Record<string, unknown>;
}

let io: SocketIOServer | null = null;

/**
 * Initialise the Socket.IO server and attach it to an existing HTTP server.
 * Calling this multiple times is safe — subsequent calls return the existing instance.
 */
export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    addTrailingSlash: false,
  });

  io.on("connection", (socket: Socket) => {
    logger.info("WebSocket client connected", { socketId: socket.id });

    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
      logger.debug("Client joined user room", { socketId: socket.id, userId });
    });

    socket.on("disconnect", () => {
      logger.info("WebSocket client disconnected", { socketId: socket.id });
    });
  });

  logger.info("WebSocket server initialised");
  return io;
}

/**
 * Emit an inventory update event to all sockets in the given user's room.
 * Silently does nothing if the WebSocket server has not been initialised yet.
 */
export function emitInventoryUpdate(payload: InventoryUpdatePayload): void {
  if (!io) {
    logger.warn("WebSocket server not initialised — skipping inventory update emission");
    return;
  }
  io.to(`user:${payload.userId}`).emit("inventory:update", payload);
  logger.debug("Emitted inventory update", { type: payload.type, productId: payload.productId });
}

/**
 * Return the active Socket.IO server instance (or null if not yet initialised).
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}
