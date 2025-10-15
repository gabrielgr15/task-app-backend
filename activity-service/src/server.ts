import dotenv from 'dotenv'
dotenv.config()
import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import http from 'http'
import logger from './logger'
import { connectDB, isDatabaseConnected } from './db'
import { initializeRabbitMQConsumer } from './rabbitmq/consumer'
import activityRoutes from './routes/activityRoutes'
import { closeRabbitMQ } from './rabbitmq/connection'
// import errorHandler from './middleware/errorHandler'


const PORT = process.env.PORT || 3003
const app = express()


async function gracefulShutdown(signal: string, server: http.Server){    
    logger.info(`Received ${signal}. Starting graceful shutdown...`)
    server.close(async () => {
        logger.info('HTTP server closed.');
        try {
            await closeRabbitMQ();
            await mongoose.connection.close();
            logger.info('MongoDB connection closed successfully.');
            logger.info('Graceful shutdown completed.');
            process.exit(0)
        } catch (error) {
            logger.error('Error during graceful shutdown cleanup:', error);
            process.exit(1)
        }
    })

    setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10000)
}



async function startServer() {    
    try {
        await connectDB()
        await initializeRabbitMQConsumer()
        app.use(express.json());
        app.use('/api', activityRoutes)
        app.get('/health', (req, res) => {
                const isDbReady = isDatabaseConnected();
                if (isDbReady) {
                    res.status(200).send('OK');
                } else {
                    res.status(503).send('Service Unavailable: Database connection not ready');
                }
            });
        //Central error handler place holder, last app.use
        const server = app.listen(PORT, () => {
            logger.info(`Activity Service running on port ${PORT}`)
            process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server))
            process.on('SIGINT', () => gracefulShutdown('SIGINT', server))
        })
    } catch (error) {
        logger.error("Fatal error during server startup:", error)
        process.exit(1)
    }
}
startServer()



process.on('unhandledRejection', (reason, promise) => {
    logger.error('!!! UNHANDLED REJECTION !!!', { reason: reason })
});
process.on('uncaughtException', (error) => {
    logger.error('!!! UNCAUGHT EXCEPTION !!!', error)
    process.exit(1);
});