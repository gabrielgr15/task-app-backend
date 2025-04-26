const redis = require('redis')
const logger = require('../logger')

const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});


(async () => {
    try { 
        redisClient.on('error', (err) => {            
            if (err.code === 'ECONNREFUSED' || err.message.includes('Connection lost')) {                 
                 logger.warn('Redis client connection error (likely reconnect attempt):', err.message);
            } else {                 
                 logger.error('Unexpected Redis client error: ', err);
            }
        })
        await redisClient.connect()
        logger.info('Redis connection succesful')
    }catch(error){
        logger.error('Error connecting to redis:', error)
    }
})()

module.exports = redisClient