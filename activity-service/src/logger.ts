import winston from 'winston'
import 'winston-daily-rotate-file'
import path from 'path'
import fs from 'fs'

const logsDirectory = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory);
}

type Replacer = (key: string, value: any) => any

const errorReplacer: Replacer = (key: string, value: any): any => {
    if (value instanceof Error) {
        const error: Record<string, any> = {}

        Object.getOwnPropertyNames(value).forEach((propName) => {
            error[propName] = value[propName as keyof typeof value];
        })
        error.message = value.message;
        error.name = value.name;
        error.stack = value.stack;

        if (value.cause) {
            try {
                error.cause = JSON.parse(JSON.stringify(value.cause, errorReplacer))
            } catch (e) {
                error.cause = "[Unserializable Cause]";
            }
        }
        return error
    }
    return value;
}

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json({ replacer: errorReplacer, space: 2 })

    ),
    transports: [
        new winston.transports.Console({
            level: 'debug',
        })
    ]
});

// Only add file transport if not test env (unblocks CI perms drama)
if (process.env.NODE_ENV !== 'test') {
    const fileRotateTransport = new winston.transports.DailyRotateFile({
        filename: path.join(logsDirectory, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '7d',
        level: 'debug'
    });
    logger.add(fileRotateTransport);
}

export default logger