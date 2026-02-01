"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvatarSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    status: zod_1.z.string().min(1).max(120).optional(),
    username: zod_1.z.string().min(3).max(32).optional()
});
exports.updateAvatarSchema = zod_1.z.object({
    avatarUrl: zod_1.z.string().url()
});
