"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listParticipantIds = exports.deleteMessage = exports.removeParticipant = exports.addParticipants = exports.markConversationRead = exports.updateMessageStatus = exports.listMedia = exports.searchMessages = exports.listMessages = exports.sendMessage = exports.getConversationById = exports.listConversations = exports.createConversation = void 0;
const prisma_1 = require("../../config/prisma");
const logger_1 = require("../../config/logger");
const createConversation = async (userId, type, title, participantIds) => {
    const participants = Array.from(new Set([userId, ...participantIds]));
    if (type === "DIRECT" && participants.length === 2) {
        const candidates = await prisma_1.prisma.conversation.findMany({
            where: {
                type: "DIRECT",
                participants: {
                    some: {
                        userId: { in: participants }
                    }
                }
            },
            include: { participants: true }
        });
        const existing = candidates.find((conversation) => {
            if (conversation.participants.length !== 2)
                return false;
            const ids = conversation.participants.map((p) => p.userId).sort();
            const target = [...participants].sort();
            return ids[0] === target[0] && ids[1] === target[1];
        });
        if (existing) {
            return prisma_1.prisma.conversation.findUnique({
                where: { id: existing.id },
                include: {
                    participants: { include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } } }
                }
            });
        }
    }
    return prisma_1.prisma.conversation.create({
        data: {
            type,
            title,
            participants: {
                create: participants.map((id) => ({ userId: id }))
            }
        },
        include: {
            participants: { include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } } }
        }
    });
};
exports.createConversation = createConversation;
const listConversations = async (userId) => {
    return prisma_1.prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        include: {
            participants: { include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } } },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    senderId: true
                }
            }
        },
        orderBy: { updatedAt: "desc" }
    });
};
exports.listConversations = listConversations;
const getConversationById = async (conversationId, userId) => {
    const conversation = await prisma_1.prisma.conversation.findFirst({
        where: { id: conversationId, participants: { some: { userId } } },
        include: {
            participants: { include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } } }
        }
    });
    if (!conversation) {
        const error = new Error("Conversation not found");
        error.status = 404;
        throw error;
    }
    return conversation;
};
exports.getConversationById = getConversationById;
const sendMessage = async (conversationId, senderId, content, type = "TEXT", attachment) => {
    const participants = await prisma_1.prisma.participant.findMany({
        where: { conversationId },
        select: { userId: true }
    });
    const isParticipant = participants.some((p) => p.userId === senderId);
    if (!isParticipant) {
        const error = new Error("Not a participant");
        error.status = 403;
        throw error;
    }
    const message = await prisma_1.prisma.message.create({
        data: {
            conversationId,
            senderId,
            content,
            type,
            ...(attachment
                ? {
                    attachments: {
                        create: {
                            url: attachment.url,
                            type: attachment.type,
                            size: attachment.size
                        }
                    }
                }
                : {})
        },
        include: {
            sender: { select: { id: true, username: true, email: true, avatarUrl: true } },
            attachments: true
        }
    });
    const participantIds = participants.map((p) => p.userId);
    void prisma_1.prisma.messageStatus
        .createMany({
        data: participants.map((p) => ({
            messageId: message.id,
            userId: p.userId,
            status: p.userId === senderId ? "READ" : "SENT"
        }))
    })
        .catch((error) => logger_1.logger.error({ error }, "Failed creating message statuses"));
    void prisma_1.prisma.conversation
        .update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    })
        .catch((error) => logger_1.logger.error({ error }, "Failed updating lastMessageAt"));
    return { message, participantIds };
};
exports.sendMessage = sendMessage;
const listMessages = async (conversationId, limit = 50, cursor, userId) => {
    if (userId) {
        const participant = await prisma_1.prisma.participant.findFirst({
            where: { conversationId, userId }
        });
        if (!participant) {
            const error = new Error("Not a participant");
            error.status = 403;
            throw error;
        }
    }
    return prisma_1.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            sender: { select: { id: true, username: true, email: true, avatarUrl: true } },
            attachments: true
        },
        ...(cursor
            ? {
                skip: 1,
                cursor: { id: cursor }
            }
            : {})
    });
};
exports.listMessages = listMessages;
const searchMessages = async (conversationId, userId, query) => {
    const participant = await prisma_1.prisma.participant.findFirst({
        where: { conversationId, userId }
    });
    if (!participant) {
        const error = new Error("Not a participant");
        error.status = 403;
        throw error;
    }
    return prisma_1.prisma.message.findMany({
        where: {
            conversationId,
            content: { contains: query, mode: "insensitive" }
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            content: true,
            createdAt: true,
            sender: { select: { id: true, username: true, email: true, avatarUrl: true } }
        },
        take: 20
    });
};
exports.searchMessages = searchMessages;
const listMedia = async (conversationId, userId) => {
    const participant = await prisma_1.prisma.participant.findFirst({
        where: { conversationId, userId }
    });
    if (!participant) {
        const error = new Error("Not a participant");
        error.status = 403;
        throw error;
    }
    return prisma_1.prisma.attachment.findMany({
        where: {
            message: { conversationId }
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
            message: {
                select: { id: true, content: true, createdAt: true, senderId: true }
            }
        }
    });
};
exports.listMedia = listMedia;
const updateMessageStatus = async (conversationId, messageId, userId, status) => {
    const participant = await prisma_1.prisma.participant.findFirst({
        where: { conversationId, userId }
    });
    if (!participant) {
        const error = new Error("Not a participant");
        error.status = 403;
        throw error;
    }
    return prisma_1.prisma.messageStatus.upsert({
        where: { messageId_userId: { messageId, userId } },
        update: { status },
        create: { messageId, userId, status }
    });
};
exports.updateMessageStatus = updateMessageStatus;
const markConversationRead = async (conversationId, userId) => {
    const participant = await prisma_1.prisma.participant.findFirst({
        where: { conversationId, userId }
    });
    if (!participant) {
        const error = new Error("Not a participant");
        error.status = 403;
        throw error;
    }
    const messages = await prisma_1.prisma.message.findMany({
        where: { conversationId },
        select: { id: true }
    });
    if (messages.length === 0) {
        return { updated: 0 };
    }
    const result = await prisma_1.prisma.messageStatus.updateMany({
        where: { userId, messageId: { in: messages.map((m) => m.id) } },
        data: { status: "READ" }
    });
    return { updated: result.count };
};
exports.markConversationRead = markConversationRead;
const addParticipants = async (conversationId, requesterId, participantIds) => {
    const requester = await prisma_1.prisma.participant.findFirst({
        where: { conversationId, userId: requesterId }
    });
    if (!requester) {
        const error = new Error("Not a participant");
        error.status = 403;
        throw error;
    }
    return prisma_1.prisma.participant.createMany({
        data: participantIds.map((id) => ({ conversationId, userId: id })),
        skipDuplicates: true
    });
};
exports.addParticipants = addParticipants;
const removeParticipant = async (conversationId, requesterId, participantId) => {
    const requester = await prisma_1.prisma.participant.findFirst({
        where: { conversationId, userId: requesterId }
    });
    if (!requester) {
        const error = new Error("Not a participant");
        error.status = 403;
        throw error;
    }
    return prisma_1.prisma.participant.delete({
        where: { conversationId_userId: { conversationId, userId: participantId } }
    });
};
exports.removeParticipant = removeParticipant;
const deleteMessage = async (conversationId, messageId, userId) => {
    const message = await prisma_1.prisma.message.findFirst({
        where: { id: messageId, conversationId }
    });
    if (!message) {
        const error = new Error("Message not found");
        error.status = 404;
        throw error;
    }
    if (message.senderId !== userId) {
        const error = new Error("Forbidden");
        error.status = 403;
        throw error;
    }
    await prisma_1.prisma.messageStatus.deleteMany({ where: { messageId } });
    await prisma_1.prisma.attachment.deleteMany({ where: { messageId } });
    await prisma_1.prisma.message.delete({ where: { id: messageId } });
    return { id: messageId };
};
exports.deleteMessage = deleteMessage;
const listParticipantIds = async (conversationId) => {
    const participants = await prisma_1.prisma.participant.findMany({
        where: { conversationId },
        select: { userId: true }
    });
    return participants.map((p) => p.userId);
};
exports.listParticipantIds = listParticipantIds;
