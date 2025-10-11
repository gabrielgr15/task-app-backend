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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
const db_1 = require("./db");
const consumer_1 = require("./rabbitmq/consumer");
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const connection_1 = require("./rabbitmq/connection");
// import errorHandler from './middleware/errorHandler'
const PORT = process.env.PORT || 3003;
const app = (0, express_1.default)();
function gracefulShutdown(signal, server) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info(`Received ${signal}. Starting graceful shutdown...`);
        server.close(() => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('HTTP server closed.');
            try {
                yield (0, connection_1.closeRabbitMQ)();
                yield mongoose_1.default.connection.close();
                logger_1.default.info('MongoDB connection closed successfully.');
                logger_1.default.info('Graceful shutdown completed.');
                process.exit(0);
            }
            catch (error) {
                logger_1.default.error('Error during graceful shutdown cleanup:', error);
                process.exit(1);
            }
        }));
        setTimeout(() => {
            logger_1.default.error('Graceful shutdown timed out. Forcing exit.');
            process.exit(1);
        }, 10000);
    });
}
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.connectDB)();
            yield (0, consumer_1.initializeRabbitMQConsumer)();
            app.use(express_1.default.json());
            app.use('/api', activityRoutes_1.default);
            app.get('/health', (req, res) => {
                res.status(200).send('Activity Service OK');
            });
            //Central error handler place holder, last app.use
            const server = app.listen(PORT, () => {
                logger_1.default.info(`Activity Service running on port ${PORT}`);
                process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
                process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
            });
        }
        catch (error) {
            logger_1.default.error("Fatal error during server startup:", error);
            process.exit(1);
        }
    });
}
startServer();
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('!!! UNHANDLED REJECTION !!!', { reason: reason });
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('!!! UNCAUGHT EXCEPTION !!!', error);
    process.exit(1);
});
