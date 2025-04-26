require('dotenv').config()
const logger = require('../config/logger')
const {ServerError, CustomError, AuthError} = require('../errors')
const jwt = require('jsonwebtoken')
const {gatewayRedisCheckBreaker} = require('../config/circuitBreaker')

async function verifyTokenAndCheckBlacklist(token) {
    if(!token) {
        logger.error('Invalid arguments passed to verifyTokenAndCheckBlacklist', {token})
        throw new ServerError('invalid argument for token verification')
    }
    let decoded = null
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)        
        if (!decoded.jti) {
            logger.warn('Token missing jti', { token });
            throw new AuthError('Invalid token structure');
        }        
        const isBlacklisted = await gatewayRedisCheckBreaker.fire(decoded.jti)
        if (isBlacklisted) throw new AuthError('Token is blacklisted');
        return decoded
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
            throw new AuthError('Invalid token');
        }else if (error instanceof CustomError){
            throw error
        }else{
            throw new ServerError('An internal server error occurred', {cause: error}) 
        }        
    }
}

module.exports = {verifyTokenAndCheckBlacklist}