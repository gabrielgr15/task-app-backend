import mongoose, { Schema, Document, Types } from "mongoose"

export interface IActivity extends Document {
    _id: Types.ObjectId,
    eventType: string;
    userId: Types.ObjectId;
    taskId: Types.ObjectId;
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
        index: true
    },
    userId : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
        index: true,
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

const Activity = mongoose.model<IActivity>('Activity', ActivitySchema)

export default Activity