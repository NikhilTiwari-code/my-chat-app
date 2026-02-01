"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.participantsSchema = exports.messageStatusSchema = exports.sendMessageSchema = exports.createConversationSchema = void 0;
const zod_1 = require("zod");
exports.createConversationSchema = zod_1.z.object({
    type: zod_1.z.enum(["DIRECT", "GROUP"]).default("DIRECT"),
    title: zod_1.z.string().optional(),
    participantIds: zod_1.z.array(zod_1.z.string().min(1)).min(1)
});
exports.sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    type: zod_1.z.enum(["TEXT", "IMAGE", "FILE"]).optional(),
    attachment: zod_1.z
        .object({
        url: zod_1.z.string().url(),
        type: zod_1.z.string(),
        size: zod_1.z.number().optional()
    })
        .optional()
});
exports.messageStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["SENT", "DELIVERED", "READ"])
});
exports.participantsSchema = zod_1.z.object({
    participantIds: zod_1.z.array(zod_1.z.string().min(1)).min(1)
});
