const mongoose = require('mongoose')

const MAX_RETRIES = 5
const timeout = 3000

async function connectDB (retriesLeft = MAX_RETRIES){        
    try{
        const MONGO_URI_FOR_TESTS = 'mongodb://127.0.0.1:27017/e2e_test_db?replicaSet=rs0&directConnection=true'
        console.log(`[dbUtils] Attempting to connect with URI: "${MONGO_URI_FOR_TESTS}"`);
        await mongoose.connect(MONGO_URI_FOR_TESTS, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 30000
        })
    }catch (error){
        if (retriesLeft > 0) {
            await new Promise(resolve => setTimeout(resolve, timeout))            
            return connectDB(retriesLeft - 1)
        }else{
            throw error
        }   
    }
}

async function disconnectDB() {
    try { await mongoose.connection.close(); } catch (e) {}
}

module.exports = {connectDB, disconnectDB}