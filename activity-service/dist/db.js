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
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
exports.isDatabaseConnected = isDatabaseConnected;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
const mongooseOptions = {
// serverSelectionTimeoutMS: 5000, // Example: Timeout after 5s instead of 30s
// autoIndex: process.env.NODE_ENV !== 'production', // Automatically build indexes in dev/test
// Add other options here if needed
};
let isDbConnected = false;
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isDbConnected || mongoose_1.default.connection.readyState >= 1) {
            logger_1.default.info('MongoDB connection already established.');
            isDbConnected = true;
            return;
        }
        const dbUri = process.env.MONGO_URI;
        if (!dbUri) {
            logger_1.default.error('FATAL ERROR: MONGO_ACTIVITY_URI environment variable is not set.');
            process.exit(1);
        }
        mongoose_1.default.connection.on('connected', () => {
            logger_1.default.info('Mongoose connected to DB.');
            isDbConnected = true;
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('Mongoose connection error:', err);
            isDbConnected = false;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('Mongoose disconnected from DB.');
            isDbConnected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('Mongoose reconnected to DB.');
            isDbConnected = true;
        });
        try {
            logger_1.default.info(`Attempting to connect to MongoDB at ${dbUri.split('@')[1] || 'URI'}`);
            yield mongoose_1.default.connect(dbUri, mongooseOptions);
        }
        catch (error) {
            logger_1.default.error('Initial Mongoose connection failed:', error);
            process.exit(1);
        }
    });
}
function disconnectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState !== 0) {
            yield mongoose_1.default.connection.close();
            logger_1.default.info('Mongoose connection closed.');
        }
    });
}
function isDatabaseConnected() {
    return isDbConnected;
}
