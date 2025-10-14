//require('dotenv').config()
const express = require('express')
const taskRoutes = require('./routes/taskRoutes')
const logger = require('./logger')
const errorHandler = require('./middleware/errorHandler')
const {initializeRabbitMQ} = require('./rabbitmq')
const {connectDB} = require('./db')
const OutboxModel = require('../models/outbox.model')
const { publishTaskEvent } = require('../rabbitmq')


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

logger.info('Starting Outbox Processor...');

const OUTBOX_POLL_INTERVAL = 5000;

setInterval(async () => {
	const event = await OutboxModel.findOneAndUpdate(
		{ status: 'PENDING' },
		{ $set: { status: 'PROCESSING' } }
	)
	if (!event) {
		return
	}
	try {
		await publishTaskEvent.publish(event.payload);
		await OutboxModel.updateOne({ _id: event._id }, { $set: { status: 'SENT' } });
		logger.info(`Successfully processed event ${event._id}`);
	} catch (err) {
		logger.error(`Failed to process event ${event._id}:`, err);
		await OutboxModel.updateOne({ _id: event._id }, { $set: { status: 'PENDING' } });
	}
}, OUTBOX_POLL_INTERVAL);


process.on('unhandledRejection', (reason, promise) => {
    logger.error('!!! UNHANDLED REJECTION !!!', { reason: reason })
});
process.on('uncaughtException', (error) => {
    logger.error('!!! UNCAUGHT EXCEPTION !!!', error)
    process.exit(1);
})