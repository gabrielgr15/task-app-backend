import express, { Router, Request, Response, NextFunction } from 'express'
import logger from '../logger'
import Activity, {IActivity} from '../models/Activity'
import { CustomError, ForbiddenError, NotFound, ServerError, } from '../errors'


const router: Router = express.Router();

router.get(
    '/tasks/:taskId/activity',
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
            const activities: IActivity[] = await Activity.find({ taskId: reqTaskId }).sort({timestamp:-1})
            if (activities.length === 0) throw new NotFound('No activities found for this task')
            if (activities[0].userId.toString() !== userId ){
                throw new ForbiddenError('Not authorized')
            }
             const responsePayload: string[] = activities.map(activity => activity.description)
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