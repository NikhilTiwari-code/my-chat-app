"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: "Validation failed",
            errors: err.errors.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
        });
    }
    const status = err.status ?? 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
