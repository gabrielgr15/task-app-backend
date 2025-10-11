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
exports.calculateRetryDelay = calculateRetryDelay;
exports.connectRabbitMQ = connectRabbitMQ;
exports.handleDisconnect = handleDisconnect;
exports.closeRabbitMQ = closeRabbitMQ;
exports.getChannel = getChannel;
const amqplib_1 = __importDefault(require("amqplib"));
const logger_1 = __importDefault(require("../logger"));
const rabbitmq_config_1 = require("../config/rabbitmq.config");
const consumer_1 = require("./consumer");
let connection = null;
let channel = null;
let isConnecting = false;
let isShuttingDown = false;
let retryAttempts = 0;
let retryTimeoutId = null;
function calculateRetryDelay(currentAttempts) {
    const exponentialDelay = rabbitmq_config_1.BASE_RETRY_DELAY_MS * Math.pow(2, currentAttempts);
    const cappedDelay = Math.min(rabbitmq_config_1.MAX_RETRY_DELAY_MS, exponentialDelay);
    const jitterDelay = Math.random() * cappedDelay;
    return Math.round(jitterDelay);
}
function scheduleReconnect(isStartupAttempt, resolve, reject) {
    if (isShuttingDown) {
        logger_1.default.info('RabbitMQ disconnection in progress');
        if (reject)
            reject(new Error('Server shutdown was called during rabbitmq connection'));
    }
    if (isStartupAttempt && retryAttempts >= rabbitmq_config_1.MAX_STARTUP_ATTEMPTS) {
        if (reject)
            reject(new Error('Max retries reached during startup.'));
    }
    if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
    }
    const delay = calculateRetryDelay(retryAttempts);
    retryAttempts++;
    logger_1.default.info(`RabbitMQ connection failed. Scheduling retry attempt ${retryAttempts} in ${delay}ms...`);
    retryTimeoutId = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
        retryTimeoutId = null;
        logger_1.default.info(`Executing scheduled retry attempt ${retryAttempts}...`);
        if (isShuttingDown) {
            logger_1.default.info('RabbitMQ disconnection in progress');
            if (reject)
                reject(new Error('Server shutdown was called during rabbitmq connection attempt'));
        }
        yield connectRabbitMQ(isStartupAttempt, resolve, reject);
    }), delay);
}
function resetRetryState() {
    if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
    }
    retryAttempts = 0;
    logger_1.default.info('RabbitMQ connection successful, resetting retry state.');
}
function connectRabbitMQ(isStartupAttempt, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        const rabbitMQUrl = process.env.RABBITMQ_URI;
        if (!rabbitMQUrl) {
            logger_1.default.error('FATAL ERROR: RABBITMQ_URI environment variable is not set');
            process.exit(1);
        }
        if (connection && channel) {
            logger_1.default.info('RabbitMQ connection and channel already established.');
            if (resolve)
                resolve(channel);
        }
        isConnecting = true;
        try {
            connection = yield amqplib_1.default.connect(rabbitMQUrl);
            resetRetryState();
            logger_1.default.info('RabbitMQ connection established successfully!');
            connection.on('error', (err) => {
                logger_1.default.error('RabbitMQ connection error:', err);
                handleDisconnect('connection', err);
            });
            connection.on('close', () => {
                logger_1.default.warn('RabbitMQ connection closed.');
                handleDisconnect('connection');
            });
            channel = yield connection.createChannel();
            logger_1.default.info('RabbitMQ channel created successfully!');
            channel.on('error', (err) => {
                logger_1.default.error('RabbitMQ channel error:', err);
                handleDisconnect('channel', err);
            });
            channel.on('close', () => {
                logger_1.default.warn('RabbitMQ channel closed.');
                handleDisconnect('channel');
            });
            logger_1.default.info(`Asserting queue: ${rabbitmq_config_1.TASK_EVENTS_QUEUE}`);
            yield channel.assertQueue(rabbitmq_config_1.TASK_EVENTS_QUEUE, { durable: true });
            logger_1.default.info(`Queue "${rabbitmq_config_1.TASK_EVENTS_QUEUE}" asserted successfully.`);
            resetRetryState();
            isConnecting = false;
            if (resolve) {
                resolve(channel);
            }
            else {
                logger_1.default.info("Background reconnect successful. Need to restart consumer.");
                yield (0, consumer_1.startConsumer)(channel)
                    .then(() => {
                    logger_1.default.info("Consumer restarted successfully after background reconnect.");
                })
                    .catch(err => {
                    logger_1.default.error("Failed to restart consumer after background reconnect:", err);
                    handleDisconnect('channel', err);
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to connect/setup RabbitMQ during initial attempt:', { error });
            connection = null;
            channel = null;
            isConnecting = false;
            scheduleReconnect(isStartupAttempt, resolve, reject);
        }
    });
}
function handleDisconnect(source, error) {
    logger_1.default.warn(`Handling disconnection event from: ${source}`, { error });
    if (!isConnecting && (connection || channel)) {
        connection = null;
        channel = null;
        logger_1.default.info('Marked connection/channel as null due to disconnect.');
        scheduleReconnect(false);
    }
    else if (isConnecting) {
        logger_1.default.info('Already attempting to connect, disconnect event ignored for scheduling.');
    }
    else {
        logger_1.default.info('Connection/channel already null, disconnect event ignored for scheduling.');
    }
}
function closeRabbitMQ() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isShuttingDown) {
            logger_1.default.warn("Shutdown already in progress.");
            return;
        }
        isShuttingDown = true;
        if (channel) {
            yield (0, consumer_1.stopConsumer)(channel);
        }
        else {
            logger_1.default.info('Skipping consumer stop: Channel not available.');
        }
        try {
            if (channel) {
                yield channel.close();
                logger_1.default.info('RabbitMQ channel closed successfully.');
                channel = null;
            }
            else {
                logger_1.default.info('RabbitMQ channel already closed or not established.');
            }
        }
        catch (error) {
            logger_1.default.error('Error closing RabbitMQ channel:', error);
        }
        try {
            if (connection) {
                yield connection.close();
                logger_1.default.info('RabbitMQ connection closed successfully.');
                connection = null;
            }
            else {
                logger_1.default.info('RabbitMQ connection already closed or not established.');
            }
        }
        catch (error) {
            logger_1.default.error('Error closing RabbitMQ connection:', error);
        }
        if (retryTimeoutId) {
            clearTimeout(retryTimeoutId);
            retryTimeoutId = null;
            resetRetryState();
            logger_1.default.info('Cleared pending RabbitMQ reconnect attempts.');
        }
        isConnecting = false;
    });
}
function getChannel() {
    logger_1.default.info("Attempting to get RabbitMQ channel (with retries)...");
    return new Promise((resolve, reject) => {
        if (channel) {
            logger_1.default.info("Channel already available.");
            resolve(channel);
            return;
        }
        logger_1.default.info("getChannel: Initiating connection attempt via connectRabbitMQ...");
        connectRabbitMQ(true, resolve, reject);
    });
}
