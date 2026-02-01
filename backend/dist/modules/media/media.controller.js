"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMedia = void 0;
const streamifier_1 = __importDefault(require("streamifier"));
const cloudinary_1 = require("../../config/cloudinary");
const uploadToCloudinary = (buffer, folder = "whatsapp-clone") => new Promise((resolve, reject) => {
    const stream = cloudinary_1.cloudinary.uploader.upload_stream({ folder, resource_type: "auto" }, (error, result) => {
        if (error || !result) {
            return reject(error ?? new Error("Upload failed"));
        }
        resolve({
            url: result.secure_url,
            bytes: result.bytes,
            format: result.format,
            resourceType: result.resource_type
        });
    });
    streamifier_1.default.createReadStream(buffer).pipe(stream);
});
const uploadMedia = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "File is required" });
    }
    const result = await uploadToCloudinary(req.file.buffer);
    return res.status(201).json({
        url: result.url,
        bytes: result.bytes,
        format: result.format,
        resourceType: result.resourceType,
        originalName: req.file.originalname
    });
};
exports.uploadMedia = uploadMedia;
