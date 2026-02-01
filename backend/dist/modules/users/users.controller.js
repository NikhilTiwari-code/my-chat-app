"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvatarHandler = exports.updateProfileHandler = exports.updateStatusHandler = exports.searchUsersHandler = exports.getMe = void 0;
const users_service_1 = require("./users.service");
const users_validation_1 = require("./users.validation");
const getMe = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await (0, users_service_1.getUserById)(req.user.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user });
};
exports.getMe = getMe;
const searchUsersHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const query = String(req.query.q ?? "").trim();
    if (!query) {
        return res.json({ users: [] });
    }
    const limit = Number(req.query.limit ?? 20);
    const users = await (0, users_service_1.searchUsers)(query, limit);
    return res.json({ users });
};
exports.searchUsersHandler = searchUsersHandler;
const updateStatusHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const status = typeof req.body?.status === "string" ? req.body.status : null;
    const updated = await (0, users_service_1.updateUserStatus)(req.user.id, status);
    return res.json({ status: updated });
};
exports.updateStatusHandler = updateStatusHandler;
const updateProfileHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = users_validation_1.updateProfileSchema.parse(req.body);
    const user = await (0, users_service_1.updateUserProfile)(req.user.id, data);
    return res.json({ user });
};
exports.updateProfileHandler = updateProfileHandler;
const updateAvatarHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = users_validation_1.updateAvatarSchema.parse(req.body);
    const user = await (0, users_service_1.updateUserAvatar)(req.user.id, data.avatarUrl);
    return res.json({ user });
};
exports.updateAvatarHandler = updateAvatarHandler;
