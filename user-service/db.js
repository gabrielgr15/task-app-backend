const mongoose = require('mongoose')
const logger = require('./logger')


const mongooseOptions = {
    // serverSelectionTimeoutMS: 5000, // Example: Timeout after 5s instead of 30s
    // autoIndex: process.env.NODE_ENV !== 'production', // Automatically build indexes in dev/test
    // Add other options here if needed
};
const retryDelay = 3000
const maxRetries = 10
let isDbConnected = false;

async function connectDB(retries = maxRetries) {    
    if (isDbConnected || mongoose.connection.readyState >= 1) {
         logger.info('MongoDB connection already established.');
         isDbConnected = true;
         return;
    }
    const dbUri = process.env.MONGO_URI

    if (!dbUri) {
        logger.error('FATAL ERROR: MONGO_ACTIVITY_URI environment variable is not set.')        
        process.exit(1);
    }
   
    mongoose.connection.on('connected', () => {
        logger.info('Mongoose connected to DB.');
        isDbConnected = true;
    });

    mongoose.connection.on('error', (err) => {
        logger.error('Mongoose connection error:', err);
        isDbConnected = false;       
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('Mongoose disconnected from DB.')
        isDbConnected = false        
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('Mongoose reconnected to DB.');
        isDbConnected = true;
    })
    try {
        logger.info(`Attempting to connect to MongoDB at ${dbUri.split('@')[1] || 'URI'}`)
        console.log(`*** USER_SERVICE DB CONNECT: Attempting connection with URI: [${dbUri}] ***`)
        await mongoose.connect(dbUri, mongooseOptions);        
    } catch (error) {
        logger.error('Initial Mongoose connection failed:', error)     
        if (retries > 0) {
            logger.info(`Retrying MongoDB connection in ${retryDelay/1000} seconds`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            await connectDB(retries - 1)
        }else{
            logger.error('Max MongoDB connection retries reached. Exiting.')
            process.exit(1);
        }           
    }
}

async function disconnectDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed.');
    }
}

function isDatabaseConnected() {
    return isDbConnected;
}

module.exports = {
    connectDB,
    disconnectDB,
    isDatabaseConnected
}