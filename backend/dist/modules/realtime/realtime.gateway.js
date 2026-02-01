"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToConversation = exports.emitToUsers = exports.emitToUser = exports.initRealtimeGateway = void 0;
const ws_1 = require("ws");
const logger_1 = require("../../config/logger");
const jwt_1 = require("../../utils/jwt");
const prisma_1 = require("../../config/prisma");
let wss = null;
const clientMeta = new Map();
const userSockets = new Map();
const initRealtimeGateway = (server) => {
    wss = new ws_1.WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (socket, req) => {
        const host = req.headers.host ?? "localhost";
        const url = new URL(req.url ?? "/", `http://${host}`);
        const token = url.searchParams.get("token") ?? "";
        try {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            const meta = { userId: payload.userId };
            clientMeta.set(socket, meta);
            if (!userSockets.has(payload.userId)) {
                userSockets.set(payload.userId, new Set());
            }
            userSockets.get(payload.userId).add(socket);
            logger_1.logger.info({ userId: payload.userId }, "WebSocket client connected");
        }
        catch {
            logger_1.logger.warn("WebSocket auth failed");
            socket.close(1008, "Unauthorized");
            return;
        }
        socket.on("message", async (data) => {
            const raw = data.toString();
            logger_1.logger.debug({ data: raw }, "WebSocket message received");
            try {
                const parsed = JSON.parse(raw);
                if (parsed?.type === "typing") {
                    const conversationId = String(parsed?.payload?.conversationId ?? "");
                    const isTyping = Boolean(parsed?.payload?.isTyping);
                    const meta = clientMeta.get(socket);
                    if (meta && conversationId) {
                        await (0, exports.emitToConversation)(conversationId, "typing", {
                            conversationId,
                            userId: meta.userId,
                            isTyping
                        });
                    }
                    return;
                }
                if (parsed?.type?.startsWith("call:")) {
                    const conversationId = String(parsed?.payload?.conversationId ?? "");
                    const meta = clientMeta.get(socket);
                    if (meta && conversationId) {
                        await (0, exports.emitToConversation)(conversationId, parsed.type, {
                            ...parsed.payload,
                            fromUserId: meta.userId
                        });
                    }
                    return;
                }
            }
            catch {
                // fall through to pong
            }
            socket.send(JSON.stringify({ type: "pong" }));
        });
        socket.on("close", () => {
            const meta = clientMeta.get(socket);
            if (meta) {
                const set = userSockets.get(meta.userId);
                set?.delete(socket);
                if (set && set.size === 0) {
                    userSockets.delete(meta.userId);
                }
                clientMeta.delete(socket);
            }
            logger_1.logger.info("WebSocket client disconnected");
        });
    });
    return wss;
};
exports.initRealtimeGateway = initRealtimeGateway;
const emitToUser = (userId, type, payload) => {
    const sockets = userSockets.get(userId);
    if (!sockets || sockets.size === 0) {
        return;
    }
    const message = JSON.stringify({ type, payload });
    sockets.forEach((socket) => {
        if (socket.readyState === ws_1.WebSocket.OPEN) {
            socket.send(message);
        }
    });
};
exports.emitToUser = emitToUser;
const emitToUsers = (userIds, type, payload) => {
    const unique = new Set(userIds);
    unique.forEach((userId) => (0, exports.emitToUser)(userId, type, payload));
};
exports.emitToUsers = emitToUsers;
const emitToConversation = async (conversationId, type, payload) => {
    if (!wss) {
        return;
    }
    const participants = await prisma_1.prisma.participant.findMany({
        where: { conversationId },
        select: { userId: true }
    });
    participants.forEach((p) => (0, exports.emitToUser)(p.userId, type, payload));
};
exports.emitToConversation = emitToConversation;
