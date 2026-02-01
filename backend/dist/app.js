"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
require("express-async-errors");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const errorHandler_1 = require("./middlewares/errorHandler");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: env_1.env.corsOrigin, credentials: true }));
    app.use((0, helmet_1.default)());
    app.use(express_1.default.json({ limit: "2mb" }));
    app.use((0, morgan_1.default)("dev"));
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.use("/api", routes_1.apiRouter);
    app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup({ openapi: "3.0.0", info: { title: "WhatsApp Clone API", version: "0.1.0" } }));
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
