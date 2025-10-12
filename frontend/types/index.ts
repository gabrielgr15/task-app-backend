export interface ITask {
    _id: string;
    title: string;
    description?: string;
    status: string;
    user: string;
    createdAt: string;
    updatedAt: string;
  }

export interface ITasksApiResponse {
    tasks: ITask[];
    totalTasks: number;
}

export interface IActivity {
  id: string;
  message: string;
  timestamp: string;
}

export interface IActivityApiResponse {
  activities: IActivity[]  
}