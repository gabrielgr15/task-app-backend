import amqp, { Connection, Channel } from 'amqplib'
import logger from '../logger'
import { TASK_EVENTS_QUEUE, BASE_RETRY_DELAY_MS, MAX_RETRY_DELAY_MS, MAX_STARTUP_ATTEMPTS } from '../config/rabbitmq.config'
import { stopConsumer, startConsumer } from './consumer'


let connection: Connection | null = null
let channel: Channel | null = null
let isConnecting = false
let isShuttingDown = false
let retryAttempts = 0
let retryTimeoutId: NodeJS.Timeout | null = null

type ResolveFunction<T = any> = (value?: T | PromiseLike<T>) => void
type RejectFunction = (reason?: any) => void

export function calculateRetryDelay(currentAttempts: number): number {
    const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, currentAttempts)
    const cappedDelay = Math.min(MAX_RETRY_DELAY_MS, exponentialDelay)
    const jitterDelay = Math.random() * cappedDelay
    return Math.round(jitterDelay);
}

function scheduleReconnect(isStartupAttempt: boolean, resolve?: ResolveFunction, reject?: RejectFunction) {
    if (isShuttingDown) {
        logger.info('RabbitMQ disconnection in progress')
        if (reject) reject(new Error('Server shutdown was called during rabbitmq connection'))
    }
    if (isStartupAttempt && retryAttempts >= MAX_STARTUP_ATTEMPTS) {
        if (reject) reject(new Error('Max retries reached during startup.'))
    }
    if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
    }
    const delay = calculateRetryDelay(retryAttempts)
    retryAttempts++;

    logger.info(`RabbitMQ connection failed. Scheduling retry attempt ${retryAttempts} in ${delay}ms...`);

    retryTimeoutId = setTimeout(async () => {
        retryTimeoutId = null;
        logger.info(`Executing scheduled retry attempt ${retryAttempts}...`)
        if (isShuttingDown) {
            logger.info('RabbitMQ disconnection in progress')
            if (reject) reject(new Error('Server shutdown was called during rabbitmq connection attempt'))
        }
        await connectRabbitMQ(isStartupAttempt, resolve, reject)

    }, delay)
}


function resetRetryState() {
    if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
    }
    retryAttempts = 0;
    logger.info('RabbitMQ connection successful, resetting retry state.');
}


export async function connectRabbitMQ(isStartupAttempt: boolean, resolve?: ResolveFunction, reject?: RejectFunction) {
    const rabbitMQUrl: string | undefined = process.env.RABBITMQ_URI
    if (!rabbitMQUrl) {
        logger.error('FATAL ERROR: RABBITMQ_URI environment variable is not set')
        process.exit(1)
    }
    if (connection && channel) {
        logger.info('RabbitMQ connection and channel already established.')
        if (resolve) resolve(channel);
    }
    isConnecting = true
    try {
        connection = await amqp.connect(rabbitMQUrl!)
        resetRetryState()
        logger.info('RabbitMQ connection established successfully!')

        connection.on('error', (err: Error) => {
            logger.error('RabbitMQ connection error:', err);
            handleDisconnect('connection', err)
        })
        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed.');
            handleDisconnect('connection')
        })

        channel = await connection.createChannel();
        logger.info('RabbitMQ channel created successfully!')


        channel.on('error', (err: Error) => {
            logger.error('RabbitMQ channel error:', err);
            handleDisconnect('channel', err)
        });
        channel.on('close', () => {
            logger.warn('RabbitMQ channel closed.');
            handleDisconnect('channel')
        });
        logger.info(`Asserting queue: ${TASK_EVENTS_QUEUE}`);
        await channel.assertQueue(TASK_EVENTS_QUEUE, { durable: true });
        logger.info(`Queue "${TASK_EVENTS_QUEUE}" asserted successfully.`);
        resetRetryState()
        isConnecting = false
        if (resolve) {
            resolve(channel);
        } else {
            logger.info("Background reconnect successful. Need to restart consumer.")
            await startConsumer(channel)
                .then(() => {
                    logger.info("Consumer restarted successfully after background reconnect.")
                })
                .catch(err => {
                    logger.error("Failed to restart consumer after background reconnect:", err)
                    handleDisconnect('channel', err);
                });
        }
    } catch (error) {
        logger.error('Failed to connect/setup RabbitMQ during initial attempt:', { error });
        connection = null
        channel = null
        isConnecting = false
        scheduleReconnect(isStartupAttempt, resolve, reject)
    }
}

export function handleDisconnect(source: 'connection' | 'channel', error?: Error) {
    logger.warn(`Handling disconnection event from: ${source}`, { error })
    if (!isConnecting && (connection || channel)) {
        connection = null;
        channel = null;
        logger.info('Marked connection/channel as null due to disconnect.');
        scheduleReconnect(false)
    } else if (isConnecting) {
        logger.info('Already attempting to connect, disconnect event ignored for scheduling.');
    } else {
        logger.info('Connection/channel already null, disconnect event ignored for scheduling.');
    }
}


export async function closeRabbitMQ(){
    if (isShuttingDown) {
        logger.warn("Shutdown already in progress.");
        return;
    }
    isShuttingDown = true
    if (channel) {
        await stopConsumer(channel)
    } else {
        logger.info('Skipping consumer stop: Channel not available.');
    }
    try {
        if (channel) {
            await channel.close()
            logger.info('RabbitMQ channel closed successfully.')
            channel = null
        } else {
            logger.info('RabbitMQ channel already closed or not established.')
        }
    } catch (error) {
        logger.error('Error closing RabbitMQ channel:', error);
    }
    try {
        if (connection) {
            await connection.close();
            logger.info('RabbitMQ connection closed successfully.');
            connection = null
        } else {
            logger.info('RabbitMQ connection already closed or not established.')
        }
    } catch (error) {
        logger.error('Error closing RabbitMQ connection:', error);
    }
    if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
        resetRetryState()
        logger.info('Cleared pending RabbitMQ reconnect attempts.');
    }
    isConnecting = false;
}


export function getChannel(): Promise<Channel> {
    logger.info("Attempting to get RabbitMQ channel (with retries)...")
    return new Promise((resolve, reject) => {
        if (channel) {
            logger.info("Channel already available.");
            resolve(channel)
            return
        }
        logger.info("getChannel: Initiating connection attempt via connectRabbitMQ...");
        connectRabbitMQ(true, resolve, reject)
    });
}