require('dotenv').config()
const express = require('express')
const authRoutes = require('./routes/auth')
const logger = require('./logger')
const errorHandler = require('./middleware/errorHandler')
const {connectDB, isDatabaseConnected} = require('./db')
const {initializeRedis} = require('./redis/redisClient')
const cookieParser = require('cookie-parser')


const app = express();
const PORT = process.env.PORT


async function startServer () {
	await connectDB()
	await initializeRedis()
	app.use(cookieParser());
	app.use(express.json());
	app.use('/api/users/auth', authRoutes);
	app.get('/health', (req, res) => {
		const isDbReady = isDatabaseConnected();
		if (isDbReady) {
			res.status(200).send('OK');
		} else {
			res.status(503).send('Service Unavailable: Database connection not ready');
		}
	});
	app.use(errorHandler)
	app.listen(PORT, () =>{
		logger.info(`Server is running on http://localhost:${PORT}`);
	})
} 
startServer()



process.on('unhandledRejection', (reason, promise) => {
	logger.error('!!! UNHANDLED REJECTION !!!', { reason: reason })
});
process.on('uncaughtException', (error) => {
	logger.error('!!! UNCAUGHT EXCEPTION !!!', error)
	process.exit(1);
});