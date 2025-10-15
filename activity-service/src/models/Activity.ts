import mongoose, { Schema, Document, Types } from "mongoose"

export interface IActivity extends Document {
    _id: Types.ObjectId,
    eventType: string;
    userId: string
    taskId: string
    taskTitle: string
    description: string
    timestamp: Date;
    details?: Record<string, any>;    
  }

const ActivitySchema : Schema<IActivity> = new Schema({ 
    eventType : {
        type: String,
        required: true,
        enum: ['TaskCreated', 'TaskUpdated', 'TaskDeleted'],
    },
    userId : {
        type: String,
        ref: 'User',
        required: true,
        index: true,
    },
    taskId: {
        type: String,
        ref: 'Task',
        required: true,
    },
    taskTitle: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    timestamp : {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    details : {
        type: Schema.Types.Mixed,
        required: false,
    }
}, {
    timestamps: true
})

ActivitySchema.index({ taskId: 1, eventType: 1 }, {
    unique: true,
    partialFilterExpression: { eventType: 'TaskCreated' }
});



const Activity = mongoose.model<IActivity>('Activity', ActivitySchema)

export default Activity