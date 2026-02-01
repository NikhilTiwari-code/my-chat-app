"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserAvatar = exports.updateUserProfile = exports.updateUserStatus = exports.searchUsers = exports.getUserById = void 0;
const prisma_1 = require("../../config/prisma");
const getUserById = async (id) => {
    return prisma_1.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, username: true, avatarUrl: true, createdAt: true }
    });
};
exports.getUserById = getUserById;
const searchUsers = async (query, limit = 20) => {
    return prisma_1.prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } }
            ]
        },
        select: { id: true, email: true, username: true, avatarUrl: true },
        take: limit
    });
};
exports.searchUsers = searchUsers;
const updateUserStatus = async (userId, status) => {
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data: { status, lastSeenAt: new Date() },
        select: { id: true, status: true, lastSeenAt: true }
    });
};
exports.updateUserStatus = updateUserStatus;
const updateUserProfile = async (userId, data) => {
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, email: true, username: true, avatarUrl: true, status: true, lastSeenAt: true }
    });
};
exports.updateUserProfile = updateUserProfile;
const updateUserAvatar = async (userId, avatarUrl) => {
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: { id: true, avatarUrl: true }
    });
};
exports.updateUserAvatar = updateUserAvatar;
