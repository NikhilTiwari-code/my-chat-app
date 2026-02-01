"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../../middlewares/auth");
const media_controller_1 = require("./media.controller");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});
exports.mediaRouter = (0, express_1.Router)();
exports.mediaRouter.use(auth_1.authMiddleware);
exports.mediaRouter.post("/upload", upload.single("file"), media_controller_1.uploadMedia);
