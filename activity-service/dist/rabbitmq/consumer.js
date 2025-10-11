"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConsumer = startConsumer;
exports.stopConsumer = stopConsumer;
exports.initializeRabbitMQConsumer = initializeRabbitMQConsumer;
const logger_1 = __importDefault(require("../logger"));
const Activity_1 = __importDefault(require("../models/Activity"));
const mongoose_1 = require("mongoose");
const connection_1 = require("./connection");
const rabbitmq_config_1 = require("../config/rabbitmq.config");
let consumerTag = null;
function startConsumer(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!channel) {
            logger_1.default.error('Cannot start consumer: RabbitMQ channel is not available.');
            return;
        }
        if (consumerTag) {
            logger_1.default.warn(`Consumer already running with tag ${consumerTag}. Skipping startConsumer.`);
            return;
        }
        try {
            logger_1.default.info(`Attempting to start consumer on queue: ${rabbitmq_config_1.TASK_EVENTS_QUEUE}`);
            const consumeResult = yield channel.consume(rabbitmq_config_1.TASK_EVENTS_QUEUE, (msg) => {
                if (msg) {
                    handleMessage(msg, channel);
                }
                else {
                    logger_1.default.warn(`Consumer for queue ${rabbitmq_config_1.TASK_EVENTS_QUEUE} received null message (cancelled?)`);
                    consumerTag = null;
                }
            }, {
                noAck: false
            });
            consumerTag = consumeResult.consumerTag;
            logger_1.default.info(`Consumer started successfully on queue: ${rabbitmq_config_1.TASK_EVENTS_QUEUE}`);
        }
        catch (error) {
            logger_1.default.error('Failed to start consumer:', error);
            consumerTag = null;
            (0, connection_1.handleDisconnect)('channel');
        }
    });
}
function handleMessage(msg, channel) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        logger_1.default.info("Received message. Processing...");
        try {
            const messageContentBuffer = msg.content;
            const messageJsonString = messageContentBuffer.toString();
            const eventData = JSON.parse(messageJsonString);
            logger_1.default.info("Successfully parsed event data:", eventData);
            let activityDescription = '';
            switch (eventData.type) {
                case 'TaskCreated':
                    activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' created.`;
                    break;
                case 'TaskUpdated':
                    activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' updated.`;
                    break;
                case 'TaskCompleted':
                    activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' completed.`;
                    break;
                case 'TaskAssigned':
                    activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' assigned to user ${eventData.assigneeId}.`;
                    break;
                default:
                    logger_1.default.warn(`Unhandled event type received: ${eventData.type}`);
                    activityDescription = `An unknown action occurred for task ${eventData.taskId}.`;
                    break;
            }
            const activityRecordForDb = {
                eventType: eventData.type,
                userId: new mongoose_1.Types.ObjectId(eventData.userId),
                taskId: new mongoose_1.Types.ObjectId(eventData.taskId),
                taskTitle: eventData.taskTitle,
                description: activityDescription,
                timestamp: new Date(eventData.timestamp),
                details: eventData
            };
            logger_1.default.debug('Attempting to save activity record:', activityRecordForDb);
            const newActivity = new Activity_1.default(activityRecordForDb);
            yield newActivity.save();
            logger_1.default.info(`Successfully recorded activity for event type ${eventData.type}, task ID ${eventData.taskId}`);
            channel.ack(msg);
            logger_1.default.info(`Acknowledged message for task ID ${eventData.taskId}`);
        }
        catch (error) {
            logger_1.default.error("Error processing message or saving activity:", {
                error: error,
                rawContent: (_a = msg.content) === null || _a === void 0 ? void 0 : _a.toString()
            });
            try {
                if (channel) {
                    channel.nack(msg, false, false);
                    logger_1.default.warn(`Negatively acknowledged message for task ID due to error.`);
                }
                else {
                    logger_1.default.error("Channel unavailable, cannot nack message. It might be redelivered upon reconnect.");
                }
            }
            catch (nackError) {
                logger_1.default.error("Failed to nack the message:", nackError);
            }
        }
    });
}
function stopConsumer(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        if (channel && consumerTag) {
            logger_1.default.info(`Attempting to cancel consumer with tag: ${consumerTag}`);
            try {
                yield channel.cancel(consumerTag);
                logger_1.default.info(`Consumer ${consumerTag} cancelled successfully.`);
                consumerTag = null;
                return true;
            }
            catch (error) {
                logger_1.default.error(`Error cancelling consumer ${consumerTag}:`, error);
                return false;
            }
        }
        else {
            if (!channel)
                logger_1.default.warn('Cannot stop consumer: Channel is not available.');
            if (!consumerTag)
                logger_1.default.warn('Cannot stop consumer: No active consumer tag stored.');
            return false;
        }
    });
}
function initializeRabbitMQConsumer() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('Initializing RabbitMQ Consumer Service...');
        try {
            const readyChannel = yield (0, connection_1.getChannel)();
            logger_1.default.info('RabbitMQ channel ready, starting consumer...');
            yield startConsumer(readyChannel);
            logger_1.default.info('RabbitMQ Consumer Service Initialized Successfully.');
        }
        catch (error) {
            logger_1.default.error('CRITICAL RabbitMQ initialization failed:', error);
            process.exit(1);
        }
    });
}
