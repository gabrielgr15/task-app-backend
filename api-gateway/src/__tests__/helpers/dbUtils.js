const mongoose = require('mongoose')

const MAX_RETRIES = 5
const timeout = 3000

async function connectDB (retriesLeft = MAX_RETRIES){        
    try{
        const MONGO_USER_URI = "mongodb://localhost:27017/user_service_db"
        await mongoose.connect(MONGO_USER_URI, {
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