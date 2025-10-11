import express, { Router, Request, Response, NextFunction } from 'express'
import logger from '../logger'
import Activity, {IActivity} from '../models/Activity'
import { CustomError, ForbiddenError, NotFound, ServerError, } from '../errors'

interface FrontendActivityPayload {
    id: string;
    message: string;
    timestamp: Date
}


const router: Router = express.Router();

router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
        const headers = req.headers
        const userId = headers['x-user-id']
        const reqTaskId = req.params.taskId
        const wantLatest = req.query.latest === 'true'        
        try {
            if (wantLatest) {
                const latestActivity: IActivity | null = await Activity.findOne({ taskId: reqTaskId }).sort({ timestamp: -1 })
                if (!latestActivity) throw new NotFound('Activity not found')
                if (latestActivity.userId.toString() !== userId) {
                    throw new ForbiddenError('Not authorized')
                }
                res.status(200).json({ 'activity': latestActivity.description })
                return
            }


            const activities: IActivity[] = await Activity.find({ userId }).sort({timestamp:-1})
            if (activities.length === 0) {
                res.status(200).json({ 'activities': [] })
                return
            }
            const responsePayload: FrontendActivityPayload[] = activities.map(activity => ({
                id: activity._id.toString(),
                message: activity.description,
                timestamp: activity.timestamp
            }))
            res.status(200).json({ 'activities': responsePayload })
        } catch (error) {
            if (error instanceof CustomError) {
                next(error)
            }
            else {
                next(new ServerError('An intenral server error occurred', { cause: error }))
            }
        }
    }
)

export default router