"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.listNotifications = exports.createNotification = void 0;
const prisma_1 = require("../../config/prisma");
const createNotification = async (userId, type, payload) => {
    return prisma_1.prisma.notification.create({
        data: {
            userId,
            type,
            payload: payload ?? undefined
        }
    });
};
exports.createNotification = createNotification;
const listNotifications = async (userId, limit = 50, cursor) => {
    return prisma_1.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor
            ? {
                skip: 1,
                cursor: { id: cursor }
            }
            : {})
    });
};
exports.listNotifications = listNotifications;
const markNotificationRead = async (id, userId) => {
    const existing = await prisma_1.prisma.notification.findFirst({
        where: { id, userId }
    });
    if (!existing) {
        const error = new Error("Notification not found");
        error.status = 404;
        throw error;
    }
    return prisma_1.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() }
    });
};
exports.markNotificationRead = markNotificationRead;
