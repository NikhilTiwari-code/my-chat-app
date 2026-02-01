"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.refreshTokens = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../config/prisma");
const jwt_1 = require("../../utils/jwt");
const refreshExpiresMs = (days) => days * 24 * 60 * 60 * 1000;
const registerUser = async (email, username, password) => {
    const existing = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
    });
    if (existing) {
        const error = new Error("User already exists");
        error.status = 409;
        throw error;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: { email, username, passwordHash }
    });
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    await prisma_1.prisma.session.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + refreshExpiresMs(30))
        }
    });
    return { user, accessToken, refreshToken };
};
exports.registerUser = registerUser;
const loginUser = async (identifier, password) => {
    const user = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }] }
    });
    if (!user) {
        const error = new Error("Invalid credentials");
        error.status = 401;
        throw error;
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid) {
        const error = new Error("Invalid credentials");
        error.status = 401;
        throw error;
    }
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    await prisma_1.prisma.session.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + refreshExpiresMs(30))
        }
    });
    return { user, accessToken, refreshToken };
};
exports.loginUser = loginUser;
const refreshTokens = async (refreshToken) => {
    const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    const session = await prisma_1.prisma.session.findFirst({
        where: { userId: payload.userId, token: refreshToken }
    });
    if (!session) {
        const error = new Error("Invalid refresh token");
        error.status = 401;
        throw error;
    }
    const newAccessToken = (0, jwt_1.signAccessToken)({ userId: payload.userId });
    const newRefreshToken = (0, jwt_1.signRefreshToken)({ userId: payload.userId });
    await prisma_1.prisma.session.update({
        where: { id: session.id },
        data: {
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + refreshExpiresMs(30))
        }
    });
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
exports.refreshTokens = refreshTokens;
const logoutUser = async (refreshToken) => {
    const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    await prisma_1.prisma.session.deleteMany({
        where: { userId: payload.userId, token: refreshToken }
    });
    return { success: true };
};
exports.logoutUser = logoutUser;
