"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startQueueConsumer = void 0;
const queue_service_1 = require("./queue.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const logger_1 = require("../../config/logger");
const startQueueConsumer = async () => {
    await (0, queue_service_1.consumeEvents)(async (event) => {
        if (!event?.type)
            return;
        if (event.type === "message:new" || event.type === "message:deleted") {
            await (0, realtime_gateway_1.emitToConversation)(event.conversationId, event.type, event.payload ?? {});
        }
        if (event.type === "notification:new") {
            await (0, realtime_gateway_1.emitToUser)(event.userId, event.type, event.payload ?? {});
        }
    });
    logger_1.logger.info("Queue consumer started");
};
exports.startQueueConsumer = startQueueConsumer;
