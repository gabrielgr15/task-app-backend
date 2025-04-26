require('dotenv').config()
const express = require('express')
const logger = require('./config/logger')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')
const authenticateToken = require('./middleware/auth')
const { handleExpressProxyError, decorateProxyReq} = require('./utils/proxyUtils')
const proxy = require('express-http-proxy')
const {initializeRedis} = require('./services/redisClient')

const app = express()

const PORT = process.env.ACTIVITY_PORT
const USER_SERVICE_URL = process.env.USER_SERVICE_URL
const TASKS_SERVICE_URL = process.env.TASKS_SERVICE_URL
const ACTIVITY_SERVICE_URL = process.env.ACTIVITY_SERVICE_URL

if (!USER_SERVICE_URL || !TASKS_SERVICE_URL) {
    logger.error('FATAL ERROR: Service urls {USER_SERVICE_URL, TASK_SERVICE_URL} are not defined in .env file')
    process.exit(1)
}


async function startServer(){
    await initializeRedis()
    app.use(cors())
    app.use(express.json())
    app.get('/health', (req, res ) => {
        res.status(200).send('Api Gateway OK');
    });
    app.use(['/api/users/auth/register', '/api/users/auth/login', '/api/users/auth/refresh'], proxy(USER_SERVICE_URL, {               
        timeout: 30000,
        proxyReqPathResolver: (req) => req.originalUrl,
        proxyErrorHandler: handleExpressProxyError,                
        })
    )
    app.use('/api/users/auth/logout', authenticateToken, proxy(USER_SERVICE_URL,{
        timeout: 30000,
        proxyReqPathResolver: (req) => req.originalUrl,
        proxyErrorHandler: handleExpressProxyError,
        proxyReqOptDecorator: decorateProxyReq
    }))
    app.use('/api/tasks/:taskId/activity', authenticateToken, proxy(ACTIVITY_SERVICE_URL,{
        timeout: 30000,
        proxyReqPathResolver: (req) => req.originalUrl,
        proxyErrorHandler: handleExpressProxyError,
        proxyReqOptDecorator: decorateProxyReq
    }))
    app.use('/api/tasks', authenticateToken, proxy(TASKS_SERVICE_URL,{
        timeout: 30000,
        proxyReqPathResolver: (req) => req.originalUrl,
        proxyErrorHandler: handleExpressProxyError,
        proxyReqOptDecorator: decorateProxyReq
    }))    
    app.use(errorHandler)
    const server = app.listen(PORT, () => {
        logger.info(`API Gateway listening on port ${PORT}`)
    })    
}
startServer()


process.on('unhandledRejection', (reason, promise) => {
    logger.error('!!! UNHANDLED REJECTION !!!', { reason: reason })
});
process.on('uncaughtException', (error) => {
    logger.error('!!! UNCAUGHT EXCEPTION !!!', error)
    process.exit(1);
})