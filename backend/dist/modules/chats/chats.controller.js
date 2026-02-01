"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessageHandler = exports.removeParticipantHandler = exports.addParticipantsHandler = exports.markConversationReadHandler = exports.updateMessageStatusHandler = exports.getConversationHandler = exports.listMediaHandler = exports.searchMessagesHandler = exports.listMessagesHandler = exports.sendMessageHandler = exports.listConversationsHandler = exports.createConversationHandler = void 0;
const chats_validation_1 = require("./chats.validation");
const chats_service_1 = require("./chats.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const queue_service_1 = require("../queue/queue.service");
const notifications_service_1 = require("../notifications/notifications.service");
const createConversationHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = chats_validation_1.createConversationSchema.parse(req.body);
    const conversation = await (0, chats_service_1.createConversation)(req.user.id, data.type, data.title, data.participantIds);
    return res.status(201).json({ conversation });
};
exports.createConversationHandler = createConversationHandler;
const listConversationsHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const conversations = await (0, chats_service_1.listConversations)(req.user.id);
    return res.json({ conversations });
};
exports.listConversationsHandler = listConversationsHandler;
const sendMessageHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = chats_validation_1.sendMessageSchema.parse(req.body);
    const { message, participantIds } = await (0, chats_service_1.sendMessage)(req.params.id, req.user.id, data.content, data.type ?? "TEXT", data.attachment);
    (0, realtime_gateway_1.emitToUsers)(participantIds, "message:new", { message });
    void (0, queue_service_1.publishEvent)({
        type: "message:new",
        conversationId: req.params.id,
        payload: { message }
    });
    void (async () => {
        await Promise.all(participantIds
            .filter((id) => id !== req.user.id)
            .map(async (id) => {
            const notification = await (0, notifications_service_1.createNotification)(id, "message", {
                conversationId: req.params.id,
                messageId: message.id,
                fromUser: message.sender
            });
            const notificationPublished = await (0, queue_service_1.publishEvent)({
                type: "notification:new",
                userId: id,
                payload: { notification }
            });
            if (!notificationPublished) {
                (0, realtime_gateway_1.emitToUser)(id, "notification:new", { notification });
            }
        }));
    })();
    return res.status(201).json({ message });
};
exports.sendMessageHandler = sendMessageHandler;
const listMessagesHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const limit = Number(req.query.limit ?? 50);
    const cursor = req.query.cursor;
    const messages = await (0, chats_service_1.listMessages)(req.params.id, limit, cursor, req.user.id);
    return res.json({ messages });
};
exports.listMessagesHandler = listMessagesHandler;
const searchMessagesHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const query = String(req.query.q ?? "").trim();
    if (!query) {
        return res.json({ messages: [] });
    }
    const messages = await (0, chats_service_1.searchMessages)(req.params.id, req.user.id, query);
    return res.json({ messages });
};
exports.searchMessagesHandler = searchMessagesHandler;
const listMediaHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const items = await (0, chats_service_1.listMedia)(req.params.id, req.user.id);
    return res.json({ items });
};
exports.listMediaHandler = listMediaHandler;
const getConversationHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const conversation = await (0, chats_service_1.getConversationById)(req.params.id, req.user.id);
    return res.json({ conversation });
};
exports.getConversationHandler = getConversationHandler;
const updateMessageStatusHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = chats_validation_1.messageStatusSchema.parse(req.body);
    const status = await (0, chats_service_1.updateMessageStatus)(req.params.id, req.params.messageId, req.user.id, data.status);
    void (0, realtime_gateway_1.emitToConversation)(req.params.id, "message:status", { messageId: req.params.messageId, status: data.status, userId: req.user.id });
    return res.json({ status });
};
exports.updateMessageStatusHandler = updateMessageStatusHandler;
const markConversationReadHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await (0, chats_service_1.markConversationRead)(req.params.id, req.user.id);
    void (0, realtime_gateway_1.emitToConversation)(req.params.id, "conversation:read", { userId: req.user.id });
    return res.json(result);
};
exports.markConversationReadHandler = markConversationReadHandler;
const addParticipantsHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = chats_validation_1.participantsSchema.parse(req.body);
    const result = await (0, chats_service_1.addParticipants)(req.params.id, req.user.id, data.participantIds);
    void (0, realtime_gateway_1.emitToConversation)(req.params.id, "conversation:participants", { action: "added", participantIds: data.participantIds });
    return res.status(201).json({ result });
};
exports.addParticipantsHandler = addParticipantsHandler;
const removeParticipantHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await (0, chats_service_1.removeParticipant)(req.params.id, req.user.id, req.params.userId);
    void (0, realtime_gateway_1.emitToConversation)(req.params.id, "conversation:participants", { action: "removed", participantId: req.params.userId });
    return res.json({ result });
};
exports.removeParticipantHandler = removeParticipantHandler;
const deleteMessageHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await (0, chats_service_1.deleteMessage)(req.params.id, req.params.messageId, req.user.id);
    void (0, queue_service_1.publishEvent)({
        type: "message:deleted",
        conversationId: req.params.id,
        payload: { messageId: req.params.messageId }
    });
    void (0, realtime_gateway_1.emitToConversation)(req.params.id, "message:deleted", {
        conversationId: req.params.id,
        messageId: req.params.messageId
    });
    return res.json(result);
};
exports.deleteMessageHandler = deleteMessageHandler;
