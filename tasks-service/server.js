//require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const taskRoutes = require('./routes/taskRoutes')
const logger = require('./logger')
const errorHandler = require('./middleware/errorHandler')
const {initializeRabbitMQ} = require('./rabbitmq')
const {connectDB} = require('./db')


const PORT = process.env.PORT
const app = express()


async function startServer(){
	await connectDB()
	await initializeRabbitMQ()
	app.use(express.json())
	app.use('/api', taskRoutes)
	app.get('/health', (req, res ) => {
				res.status(200).send('Tasks Service OK');
	})
	app.use(errorHandler)
	const server = app.listen(PORT, async () => {
		logger.info(`Tasks Server is running on http://localhost:${PORT}`)	
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