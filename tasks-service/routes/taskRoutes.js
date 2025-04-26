const express = require('express')
const { body, validationResult } = require('express-validator')
const Task = require('../models/task')
const logger = require('../logger')
const {ValidationError, ServerError, CustomError, NotFound, ForbiddenError}= require('../errors')
const { publishTaskEvent } = require('../rabbitmq')

const router = express.Router()


router.post(
    '/tasks',
    [       
        body('title', 'Title is required').trim().notEmpty().isLength({ max: 20 }),
        body('status', 'A status is required').trim().notEmpty().isLength({ max: 20 }),
        body('description', 'The description must be shorter').trim().isLength({ max: 30 }),
    ],
    async (req, res, next) => {               		
        const errors = validationResult(req)
        if (!errors.isEmpty()) {            
            return next(new ValidationError('Invalid input', errors.array()))
        }
        const headers = req.headers
        const userId = headers['x-user-id']           
        try {
            const { title, status, description } = req.body

            let newTask = new Task({
                title,
                status,
                description,
                user: userId
            })            
            const task = await newTask.save()
			try {				
				const eventData = {
					type: 'TaskCreated', 
					taskId: task._id.toString(),
					userId: userId,
					taskTitle: task.title,
					timestamp: new Date().toISOString()
				}				
				publishTaskEvent(eventData)
		   } catch (publishError) {				
				logger.error("Failed to publish TaskCreated event after task save:", publishError)				
		   }           
            return res.status(201).json({ msg: 'Task succesfully created', taskId: task._id, title, status, description })
        } catch (error) {
            next(new ServerError('An internal server error occurred', {cause: error}))
        }
    }
)


router.get(
	'/tasks',
	async (req, res, next) => {
		const headers = req.headers
		const userId = headers['x-user-id']
		try {
			const pageNumber = parseInt(req.query.page)
			const limitNumber = parseInt(req.query.limit)
            if (pageNumber <= 0) pageNumber = 1;
            if (limitNumber <= 0) limitNumber = 10;

			const skipValue = (pageNumber - 1) * limitNumber

			const totalTasks = await Task.countDocuments({ user: userId })
			const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 }).skip(skipValue).limit(limitNumber)

			return res.status(200).json({ totalTasks, tasks })
		} catch (error) {
			next(new ServerError('An internal server error occurred', {cause: error}))
		}
})

router.patch(
	'/tasks/:id',
	[       
        body('title', 'Title is required').trim().notEmpty().isLength({ max: 20 }),
        body('status', 'A status is required').trim().notEmpty().isLength({ max: 20 }),
        body('description', 'The description must be shorter').trim().isLength({ max: 30 }),
    ],
	async (req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return next(new ValidationError('Invalid input', errors.array()))
		}
		const headers = req.headers
        const taskId = req.params.id
        const userId = headers['x-user-id']
		try {
			const task = await Task.findById(taskId)
			if (!task) throw new NotFound('Task not found')				
			if (userId !== task.user.toString()) {
				throw new ForbiddenError('Not authorized to update this task')
			}
			const { title, description, status } = req.body

			task.title = title
			task.description = description
			task.status = status
			await task.save()
			return res.status(200).json({msg: 'Task succesfully updated', taskId: task._id, title, description, status })
		} catch (error) {
			if (error instanceof CustomError){
                next(error)
            }else{
                next(new ServerError('An internal server error occurred', {cause: error}))                
            }
		}
})

router.delete(
	'/tasks/:id',
	async (req, res, next) => {
		const headers = req.headers
        const userId = headers['x-user-id']
        const taskId = req.params.id
		try {
			const task = await Task.findById(taskId)
			if (!task) throw new NotFound('Task not found')		
			if (userId !== task.user.toString()) {
				throw new ForbiddenError('Not authorized to delete this task')
			}
			await task.deleteOne()
			return res.status(200).json({ msg: 'Task succesfully deleted' })
		} catch (error) {
			if (error instanceof CustomError){
                next(error)
            }else{
                next(new ServerError('An internal server error occurred', {cause: error}))
            }
		}
})


module.exports = router
