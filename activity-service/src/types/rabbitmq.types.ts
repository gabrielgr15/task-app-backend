export interface TaskEventData {
    type: string
    taskId: string  
    userId: string
    taskTitle: string
    timestamp: string    
    assigneeId?: string    
}