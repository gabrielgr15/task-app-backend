const redis = require('redis');
const logger = require('../logger'); 


const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD; 


const clientOptions = {
    socket: {
        host: redisHost,
        port: parseInt(redisPort, 10),
    }
}


if (redisPassword) {
    clientOptions.password = redisPassword;
    logger.info(`Connecting to Redis at ${redisHost}:${redisPort} WITH password authentication.`);
} else {
    logger.info(`Connecting to Redis at ${redisHost}:${redisPort} WITHOUT password authentication.`);
}


const redisClient = redis.createClient(clientOptions);


async function initializeRedis (){
    try {
        redisClient.on('error', (err) => {            
            logger.error('Redis client error', {
                code: err.code,
                message: err.message
            })
        })
        redisClient.on('ready', () => {
            logger.info(`Connected to Redis successfully at ${redisHost}:${redisPort}!`)
        })
        await redisClient.connect();        
    } catch (error) {        
        logger.error(`Failed to initially connect to Redis at ${redisHost}:${redisPort}:`, error)        
    }
}

module.exports = {redisClient, initializeRedis}