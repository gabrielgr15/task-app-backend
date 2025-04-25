import { ConsumeMessage, Channel} from 'amqplib'
import logger from '../logger'
import Activity from '../models/Activity'
import {Types} from 'mongoose'
import {getChannel, handleDisconnect} from './connection'
import {TASK_EVENTS_QUEUE} from '../config/rabbitmq.config'
import {TaskEventData} from '../types/rabbitmq.types'




let consumerTag: string | null = null

export async function startConsumer(channel: Channel | null) {    
    if (!channel) {
        logger.error('Cannot start consumer: RabbitMQ channel is not available.')        
        return
    }
    if (consumerTag) {
        logger.warn(`Consumer already running with tag ${consumerTag}. Skipping startConsumer.`);
        return
   }
    try {
        logger.info(`Attempting to start consumer on queue: ${TASK_EVENTS_QUEUE}`)
        const consumeResult = await channel.consume(
            TASK_EVENTS_QUEUE,
            (msg: ConsumeMessage | null) => {                
                if (msg) {
                     handleMessage(msg, channel)
                } else {
                    logger.warn(`Consumer for queue ${TASK_EVENTS_QUEUE} received null message (cancelled?)`);
                    consumerTag = null
                }
            },
            {
                noAck: false
            }
        )
        consumerTag = consumeResult.consumerTag
        logger.info(`Consumer started successfully on queue: ${TASK_EVENTS_QUEUE}`)
    } catch (error) {
        logger.error('Failed to start consumer:', error)     
        consumerTag = null   
        handleDisconnect('channel')
    }
}



async function handleMessage(msg: ConsumeMessage, channel: Channel) {
    logger.info("Received message. Processing...");

    try {        
        const messageContentBuffer: Buffer = msg.content;
        const messageJsonString: string = messageContentBuffer.toString();
        const eventData = JSON.parse(messageJsonString) as TaskEventData
        logger.info("Successfully parsed event data:", eventData);
        
        let activityDescription = '';
        switch (eventData.type) {
            case 'TaskCreated':                
                activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' created.`;
                break;
            case 'TaskUpdated':                
                activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' updated.`;
                break;
            case 'TaskCompleted':
                 activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' completed.`;
                 break;
            case 'TaskAssigned':
                 activityDescription = `Task '${eventData.taskTitle || eventData.taskId}' assigned to user ${eventData.assigneeId}.`
                 break;            
            default:
                logger.warn(`Unhandled event type received: ${eventData.type}`)                
                activityDescription = `An unknown action occurred for task ${eventData.taskId}.`
                break;
        }
        
        const activityRecordForDb = {
            eventType: eventData.type,
            userId: new Types.ObjectId(eventData.userId),
            taskId: new Types.ObjectId(eventData.taskId), 
            taskTitle: eventData.taskTitle,            
            description: activityDescription,
            timestamp: new Date(eventData.timestamp), 
            details: eventData
        }
       
        logger.debug('Attempting to save activity record:', activityRecordForDb);
        const newActivity = new Activity(activityRecordForDb);
        await newActivity.save();        

        logger.info(`Successfully recorded activity for event type ${eventData.type}, task ID ${eventData.taskId}`);

        channel!.ack(msg);

        logger.info(`Acknowledged message for task ID ${eventData.taskId}`)        

    } catch (error) {
        logger.error("Error processing message or saving activity:", {
             error: error,
             rawContent: msg.content?.toString()
        });
        try {
            if (channel) {                
                channel.nack(msg, false, false)
                logger.warn(`Negatively acknowledged message for task ID due to error.`);
            } else {
                logger.error("Channel unavailable, cannot nack message. It might be redelivered upon reconnect.");
            }
       } catch (nackError) {
            logger.error("Failed to nack the message:", nackError)            
       }
    }
}

export async function stopConsumer(channel: Channel | null): Promise<boolean> {
    if (channel && consumerTag) {
        logger.info(`Attempting to cancel consumer with tag: ${consumerTag}`);
        try {
            await channel.cancel(consumerTag);
            logger.info(`Consumer ${consumerTag} cancelled successfully.`);
            consumerTag = null 
            return true;
        } catch (error) {
            logger.error(`Error cancelling consumer ${consumerTag}:`, error)            
            return false;
        }
    } else {
        if (!channel) logger.warn('Cannot stop consumer: Channel is not available.');
        if (!consumerTag) logger.warn('Cannot stop consumer: No active consumer tag stored.');
        return false;
    }
}

export async function initializeRabbitMQConsumer () {
    logger.info('Initializing RabbitMQ Consumer Service...');
    try {        
        const readyChannel: Channel = await getChannel()        
        logger.info('RabbitMQ channel ready, starting consumer...');
        await startConsumer(readyChannel);

        logger.info('RabbitMQ Consumer Service Initialized Successfully.');

    } catch (error) {
        logger.error('CRITICAL RabbitMQ initialization failed:', error);
        process.exit(1);
    }
}

