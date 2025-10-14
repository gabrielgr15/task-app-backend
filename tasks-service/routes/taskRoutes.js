const express = require('express')
const { body, validationResult } = require('express-validator')
const Task = require('../models/task')
const OutboxModel = require('../models/outbox.model')
const logger = require('../logger')
const { ValidationError, ServerError, CustomError, NotFound, ForbiddenError } = require('../errors')

const mongoose = require('mongoose')
const outboxModel = require('../models/outbox.model')

const router = express.Router()


router.post(
	'/tasks',
	[
		body('title', 'Title is required').trim().notEmpty().isLength({ max: 35 }),
		body('status', 'A status is required').trim().notEmpty().isLength({ max: 20 }),
		body('description', 'The description must be shorter').trim().isLength({ max: 45 }),
	],
	async (req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return next(new ValidationError('Invalid input', errors.array()))
		}
		const headers = req.headers
		const userId = headers['x-user-id']
		const session = await mongoose.startSession()
		const { title, status, description } = req.body

		try {
			await session.withTransaction(async () => {
				const taskData = {
					title,
					status,
					description,
					user: userId
				}
				const createdTasks = await Task.create([taskData], { session })
				const newTask = createdTasks[0]
				const eventPayload = {
					type: 'TaskCreated',
					taskId: newTask._id.toString(),
					userId: userId,
					taskTitle: newTask.title,
					timestamp: new Date().toISOString()
				}

				await OutboxModel.create([
					{
						payload: eventPayload
					}
				], { session })
				return res.status(201).json({ msg: 'Task succesfully created', task })

			})
		} catch (error) {
			logger.error('Transaction failed:', error);
			next(new ServerError('An internal server error occurred', { cause: error }))
		} finally {
			await session.endSession();
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
			next(new ServerError('An internal server error occurred', { cause: error }))
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
			return res.status(200).json({ msg: 'Task succesfully updated', task })
		} catch (error) {
			if (error instanceof CustomError) {
				next(error)
			} else {
				next(new ServerError('An internal server error occurred', { cause: error }))
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
			if (error instanceof CustomError) {
				next(error)
			} else {
				next(new ServerError('An internal server error occurred', { cause: error }))
			}
		}
	})


module.exports = router
