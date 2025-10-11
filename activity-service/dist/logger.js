"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
require("winston-daily-rotate-file");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logsDirectory = path_1.default.join(__dirname, 'logs');
if (!fs_1.default.existsSync(logsDirectory)) {
    fs_1.default.mkdirSync(logsDirectory);
}
const fileRotateTransport = new winston_1.default.transports.DailyRotateFile({
    filename: path_1.default.join(logsDirectory, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d',
    level: 'debug'
});
const consoleTransport = new winston_1.default.transports.Console({
    level: 'debug',
});
const errorReplacer = (key, value) => {
    if (value instanceof Error) {
        const error = {};
        Object.getOwnPropertyNames(value).forEach((propName) => {
            error[propName] = value[propName];
        });
        error.message = value.message;
        error.name = value.name;
        error.stack = value.stack;
        if (value.cause) {
            try {
                error.cause = JSON.parse(JSON.stringify(value.cause, errorReplacer));
            }
            catch (e) {
                error.cause = "[Unserializable Cause]";
            }
        }
        return error;
    }
    return value;
};
const logger = winston_1.default.createLogger({
    level: 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json({ replacer: errorReplacer, space: 2 })),
    transports: [
        fileRotateTransport,
        consoleTransport
    ]
});
exports.default = logger;
