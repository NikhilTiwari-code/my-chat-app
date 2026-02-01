"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeEvents = exports.publishEvent = exports.initQueue = void 0;
const amqplib = __importStar(require("amqplib"));
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
let connection = null;
let channel = null;
let lastFailureAt = null;
const failureCooldownMs = 30000;
const QUEUE_NAME = "chat.events";
const initQueue = async () => {
    if (lastFailureAt && Date.now() - lastFailureAt < failureCooldownMs) {
        return { channel: null, queue: QUEUE_NAME };
    }
    if (channel)
        return { channel, queue: QUEUE_NAME };
    try {
        connection = await amqplib.connect(env_1.env.rabbitmqUrl);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        logger_1.logger.info("RabbitMQ connected");
        return { channel, queue: QUEUE_NAME };
    }
    catch (error) {
        lastFailureAt = Date.now();
        logger_1.logger.error({ error }, "RabbitMQ connection failed");
        return { channel: null, queue: QUEUE_NAME };
    }
};
exports.initQueue = initQueue;
const publishEvent = async (event) => {
    try {
        if (lastFailureAt && Date.now() - lastFailureAt < failureCooldownMs) {
            return false;
        }
        if (!channel) {
            await (0, exports.initQueue)();
        }
        if (!channel)
            return false;
        const payload = Buffer.from(JSON.stringify(event));
        channel.sendToQueue(QUEUE_NAME, payload, { persistent: true });
        return true;
    }
    catch (error) {
        logger_1.logger.error({ error }, "RabbitMQ publish failed");
        return false;
    }
};
exports.publishEvent = publishEvent;
const consumeEvents = async (onMessage) => {
    if (!channel) {
        await (0, exports.initQueue)();
    }
    if (!channel)
        return;
    await channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg)
            return;
        try {
            const event = JSON.parse(msg.content.toString());
            await onMessage(event);
            channel?.ack(msg);
        }
        catch (error) {
            logger_1.logger.error({ error }, "Failed processing queue event");
            channel?.nack(msg, false, false);
        }
    });
};
exports.consumeEvents = consumeEvents;
