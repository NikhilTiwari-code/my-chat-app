"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const realtime_gateway_1 = require("./modules/realtime/realtime.gateway");
const queue_consumer_1 = require("./modules/queue/queue.consumer");
const prisma_1 = require("./config/prisma");
const app = (0, app_1.createApp)();
const server = http_1.default.createServer(app);
(0, realtime_gateway_1.initRealtimeGateway)(server);
(0, queue_consumer_1.startQueueConsumer)().catch((error) => {
    logger_1.logger.error({ error }, "Queue consumer failed to start");
});
prisma_1.prisma
    .$connect()
    .then(() => logger_1.logger.info("Prisma connected"))
    .catch((error) => logger_1.logger.error({ error }, "Prisma connection failed"));
server.listen(env_1.env.port, () => {
    logger_1.logger.info(`Server running on port ${env_1.env.port}`);
});
