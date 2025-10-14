const mongoose = require('mongoose')

const eventDataSchema = new mongoose.Schema({
    type: String,
    taskId: String,
    userId: String,
    taskTitle: String,
    timestamp: String
}, { _id: false });


const outboxSchema = new mongoose.Schema({
    payload: {
        type: eventDataSchema,
        required: true
    },

    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SENT'],
        default: 'PENDING'
    },

    createdAt:{
        type: Date,
        default: Date.now
}    
})

module.exports = mongoose.model('Outbox', outboxSchema)

