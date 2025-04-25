import mongoose from 'mongoose'
import logger from './logger'


const mongooseOptions = {
    // serverSelectionTimeoutMS: 5000, // Example: Timeout after 5s instead of 30s
    // autoIndex: process.env.NODE_ENV !== 'production', // Automatically build indexes in dev/test
    // Add other options here if needed
};

let isDbConnected = false;

export async function connectDB() {    
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
        await mongoose.connect(dbUri, mongooseOptions);        
    } catch (error) {
        logger.error('Initial Mongoose connection failed:', error)        
        process.exit(1);
    }
}

export async function disconnectDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed.');
    }
}

export function isDatabaseConnected() {
    return isDbConnected;
}
