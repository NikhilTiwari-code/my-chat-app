"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationReadHandler = exports.listNotificationsHandler = void 0;
const notifications_service_1 = require("./notifications.service");
const listNotificationsHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const limit = Number(req.query.limit ?? 50);
    const cursor = req.query.cursor;
    const notifications = await (0, notifications_service_1.listNotifications)(req.user.id, limit, cursor);
    return res.json({ notifications });
};
exports.listNotificationsHandler = listNotificationsHandler;
const markNotificationReadHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const notification = await (0, notifications_service_1.markNotificationRead)(req.params.id, req.user.id);
    return res.json({ notification });
};
exports.markNotificationReadHandler = markNotificationReadHandler;
