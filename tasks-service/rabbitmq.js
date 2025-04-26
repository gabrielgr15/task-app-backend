const amqp = require('amqplib')
const logger = require('./logger')

const rabbitMQUrl = process.env.RABBITMQ_URI


if (!rabbitMQUrl) {
    logger.error('FATAL ERROR: RABBITMQ_URI environment variable is not set')
    process.exit(1)
} else {
    logger.info('RabbitMQ URI found')
}
const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30000
let connection = null;
let channel = null;
let retryCounter = 0
const TASK_EVENTS_QUEUE = 'task_events'
let retryTimeoutId = null
const MAX_STARTUP_ATTEMPTS = 10
let isConnecting = false
let isShuttingDown = false

async function connectRabbitMQ(isStartup, resolve, reject) {
    try {
        if (connection && channel) {
            logger.info('RabbitMQ connection and channel already established.')
            if (resolve) {
                resolve();
            } else {
                logger.info("Background reconnect successful")
            }
        }
        isConnecting = true
        logger.info('Attempting to connect to RabbitMQ...')
        connection = await amqp.connect(rabbitMQUrl);
        logger.info('RabbitMQ connection established successfully!')

        connection.on('error', (error) => {
            logger.error('RabbitMQ connection error:', err)
            handleDisconnect('connection', error)
        })
        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed.')
            handleDisconnect('connection')
        })
        channel = await connection.createChannel();
        logger.info('RabbitMQ channel created successfully!')

        channel.on('error', (error) => {
            logger.error('RabbitMQ channel error:', err)
            handleDisconnect('channel', error)
        })
        channel.on('close', () => {
            logger.warn('RabbitMQ channel closed.')
            handleDisconnect('channel')
        })
        await channel.assertQueue(TASK_EVENTS_QUEUE, { durable: true })
        logger.info(`Queue "${TASK_EVENTS_QUEUE}" asserted successfully.`)
        isConnecting = false
        if (resolve) {
            resolve();
        } else {
            logger.info("Background reconnect successful")
        }
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ during initial setup:', error)
        scheduleReconnect(isStartup, resolve, reject)
    }
}

function handleDisconnect(source, error) {
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

function scheduleReconnect(isStartup, resolve, reject) {
    if (isShuttingDown) {
        logger.info('RabbitMQ disconnection in progress')
        if (reject) reject(new Error('Server shutdown was called during rabbitmq connection attempt'))
    }
    if (isStartup && retryCounter >= MAX_STARTUP_ATTEMPTS) {
        reject(new Error('Max retries reached during startup.'))
    }
    clearTimeout(retryTimeoutId)
    const delay = calculateRetryDelay(retryCounter)
    retryCounter++
    logger.info(`RabbitMQ connection failed. Scheduling retry attempt ${retryCounter} in ${delay}ms...`);
    retryTimeoutId = setTimeout(async () => {
        retryTimeoutId = null
        logger.info(`Executing scheduled retry attempt ${retryCounter}...`)
        if (isShuttingDown) {
            logger.info('RabbitMQ disconnection in progress')
            if (reject) reject(new Error('Server shutdown was called during rabbitmq connection attempt'))
        }
        await connectRabbitMQ(isStartup, resolve, reject)
    }, delay)
}


function calculateRetryDelay(currentAttempts) {
    const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, currentAttempts)
    const cappedDelay = Math.min(MAX_RETRY_DELAY_MS, exponentialDelay)
    const jitterDelay = cappedDelay * Math.random()
    return Math.round(jitterDelay)
}


async function publishTaskEvent(eventData) {
    if (!channel) {
        logger.error('RabbitMQ channel is not available. Cannot publish message.')
        scheduleReconnect(false)
    }
    try {
        const messageBuffer = Buffer.from(JSON.stringify(eventData))
        channel.sendToQueue(TASK_EVENTS_QUEUE, messageBuffer, { persistent: true })
        logger.info(`Published event to queue "${TASK_EVENTS_QUEUE}":`, JSON.stringify(eventData))
    } catch (error) {
        logger.error('Failed to publish task event:', error)
        // Optional: Handle publish errors (e.g., channel closed unexpectedly)
        // Maybe try to reconnect/re-publish?
        if (error.message.includes('Channel closed')) {
            channel = null
        }
    }
}


async function initializeRabbitMQ() {
    if (!connection || !channel) {
        logger.info('RabbitMQ connection not ready. Initializing...')
        await getChannel();
    } else {
        logger.info('RabbitMQ connection already established.')
    }
}

function getChannel() {
    logger.info('Attempting rabbitmq startup connection')
    return new Promise((resolve, reject) => {
        connectRabbitMQ(true, resolve, reject)
    })
}


let shutdownPromise = null

function closeRabbitMQ() {
    if (shutdownPromise) {
        logger.warn("Shutdown already in progress. Waiting for existing shutdown to complete.");
        return shutdownPromise;
    }
    logger.info("Initiating graceful shutdown of RabbitMQ resources...");
    isShuttingDown = true
    shutdownPromise = (async () => {
        try {
            try {
                if (channel) {
                    await channel.close();
                    logger.info('RabbitMQ channel closed successfully.');
                } else {
                    logger.info('RabbitMQ channel already closed or not established.');
                }
            } catch (error) {
                logger.error('Error closing RabbitMQ channel:', error)
            } finally {
                channel = null
            }
            try {
                if (connection) {
                    await connection.close();
                    logger.info('RabbitMQ connection closed successfully.');
                } else {
                    logger.info('RabbitMQ connection already closed or not established.');
                }
            } catch (error) {
                logger.error('Error closing RabbitMQ connection:', error)
            } finally {
                connection = null
            }
            if (retryTimeoutId) {
                clearTimeout(retryTimeoutId);
                retryTimeoutId = null;
                retryCounter = 0
                logger.info('Cleared pending RabbitMQ reconnect attempts.');
            }
            isConnecting = false
            logger.info("RabbitMQ resource cleanup complete.")
        } catch (error) {
            logger.error("Error during RabbitMQ graceful shutdown process:", error)
            throw error;
        }
    })()
    return shutdownPromise
}



module.exports = {
    initializeRabbitMQ,
    publishTaskEvent,
    closeRabbitMQ,
};