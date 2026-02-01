"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSchema = exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6)
});
exports.loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6)
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10)
});
exports.logoutSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10)
});
