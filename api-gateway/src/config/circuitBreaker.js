const CircuitBreaker = require('opossum')
const logger = require('./logger')
const {redisClient} = require('../services/redisClient')

logger.info('API Gateway: Circuit breaker configuration module loaded.')

const checkGatewayBlacklistAction = async (tokenId) => {
    const redisKey = `blacklist:${tokenId}`    
    logger.debug(`[checkGatewayBlacklistAction] Gateway attempting Redis EXISTS: Key=${redisKey}`);
    try {        
        const result = await redisClient.exists(redisKey)
        logger.info(`[checkGatewayBlacklistAction] Gateway Redis EXISTS result for key ${redisKey}: ${result}`);
        return result
    } catch (error) {
        logger.error(`[checkGatewayBlacklistAction] Gateway Redis EXISTS failed for key ${redisKey}:`, error);
        throw error
    }
}

const gatewayFallbackFunction = (tokenId, error) => {
    const reason = error ? error.message : 'Circuit Open';
    logger.warn(`[GatewayRedisBlacklistCheck] Fallback function executing.
         Assuming token NOT blacklisted. Reason: ${reason},
          JTI: ${tokenId?.substring(0, 8)}...`);
    return 0 
}

const redisGatewayCheckOptions = {    
    rollingCountTimeout: 10000,
    volumeThreshold: 3,
    errorThresholdPercentage: 50,
    timeout: 3000,
    resetTimeout: 20000,    
};

const gatewayRedisCheckBreaker = new CircuitBreaker(checkGatewayBlacklistAction, redisGatewayCheckOptions);

gatewayRedisCheckBreaker.fallback(gatewayFallbackFunction)

logger.info(`API Gateway: Circuit breaker "${gatewayRedisCheckBreaker.name}" initialized.`);


gatewayRedisCheckBreaker.on('open', () => {
    logger.error(`[${gatewayRedisCheckBreaker.name}] Circuit OPENED. Failing fast and using fallback.`);
});


gatewayRedisCheckBreaker.on('close', () => {
    logger.info(`[${gatewayRedisCheckBreaker.name}] Circuit CLOSED. Redis calls have resumed.`);
});


gatewayRedisCheckBreaker.on('halfOpen', () => {
    logger.warn(`[${gatewayRedisCheckBreaker.name}] Circuit HALF-OPEN. Attempting next Redis call.`);
});


gatewayRedisCheckBreaker.on('fallback', (result, error) => {
    logger.warn({
        message: `[${gatewayRedisCheckBreaker.name}] Fallback executed.`,
        fallbackResult: result,
        triggeringError: error ? error.message : 'N/A (Circuit was open)',
    });
});


gatewayRedisCheckBreaker.on('success', (result) => {
    logger.debug({
        message: `[${gatewayRedisCheckBreaker.name}] Action successful.`,
        actionResult: result,
    });
});


gatewayRedisCheckBreaker.on('failure', (error) => {
    logger.error({
        message: `[${gatewayRedisCheckBreaker.name}] Action failed.`,
        error: error ? error.message : 'Unknown Error',
    });
});


logger.info(`API Gateway: Event listeners attached to circuit breaker "${gatewayRedisCheckBreaker.name}".`)

module.exports = {
    gatewayRedisCheckBreaker,
};