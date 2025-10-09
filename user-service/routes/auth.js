const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken')
const { generateTokens, generateBlacklistData } = require('../utils/tokenUtils')
const logger = require('../logger')
const { AuthError, ServerError, ValidationError, ConflictError, CustomError } = require('../errors')
const {redisAddBreaker} = require('../utils/circuitBreaker') 

const router = express.Router();

router.post(
	'/register',
	[
		body('username', 'Username is required').notEmpty().trim(),
		body('email', 'Please include a valid email').isEmail().normalizeEmail(),
		body('password', 'Password must be 6+ characters').isLength({ min: 6 }),
	],
	async (req, res, next) => {		
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return next(new ValidationError('Invalid input', errors.array()))
		}
		const { username, email, password } = req.body
		try {
			const existingUser = await User.findOne({ email });
			if (existingUser) throw new ConflictError('Email already registered');

			const user = new User({ username, email });
			user.password = await bcrypt.hash(password, 10);
			await user.save();

			const { accessToken, refreshToken } = await generateTokens(user._id);
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'Strict',
				maxAge: 7 * 24 * 60 * 60 * 1000
			})
			return res.status(201).json({ accessToken });
		} catch (error) {
			if (error instanceof CustomError) {
				next(error)
			} else {
				next(new ServerError('An internal server error occurred', { cause: error }))
			}

		}
	}
)


router.post(	
	'/login',
	[		
		body('email', 'The email is incorrect').notEmpty().isEmail().normalizeEmail(),
		body('password', 'The password is incorrect').notEmpty(),		
	],	
	async (req, res, next) => {		
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return next(new ValidationError('Invalid credentials', errors.array()))
		}		
		const { email, password } = req.body		
		try {
			const user = await User.findOne({ email }).select('+password')

			if (!user) throw new AuthError('Invalid credentials')
			if (!user.password) throw new ServerError('User data incomplete in database')

			const isMatch = await bcrypt.compare(password, user.password)
			if (!isMatch) throw new AuthError('Incorrect password')

			const userId = user._id
			const { accessToken, refreshToken } = await generateTokens(userId)

			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'Strict', 
				maxAge: 7 * 24 * 60 * 60 * 1000
			})
			return res.status(200).json({ accessToken });
		} catch (error) {
			if (error instanceof CustomError) {
				next(error)
			} else {
				next(new ServerError('An internal server error occurred', { cause: error }))
			}
		}
	})


router.post(
	'/refresh',
	async (req, res, next) => {
		try {
			const token = req.cookies.refreshToken
			if (!token) throw new AuthError('Refresh token missing')
			const storedToken = await RefreshToken.findOne({ token })
			if (!storedToken) throw new AuthError('Invalid refresh token')
			if (storedToken.expiresAt < new Date()) {
				await RefreshToken.findByIdAndDelete(storedToken._id)
				throw new AuthError('Refresh token expired')
			}			
			const user = storedToken.user
			if (!user || !user._id) throw new ServerError('Error reading user data from refresh token')

			await RefreshToken.findByIdAndDelete(storedToken._id)

			const userId = user._id
			const { refreshToken, accessToken } = await generateTokens(userId)

			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'Strict', 
				maxAge: 7 * 24 * 60 * 60 * 1000
			})
			return res.status(200).json({ accessToken })
		} catch (error) {
			if (error instanceof CustomError) {
				next(error)
			} else {
				next(new ServerError('An internal server error occurred', { cause: error }))
			}
	}}
)


router.post(
	'/logout',	
	async (req, res, next) => {
		const headers = req.headers
		const tokenId = headers['x-token-id']
		const expiryHeader = headers['x-token-expiry']
		const expirationTimestamp = parseInt(expiryHeader, 10)
		const refreshToken = req.cookies.refreshToken		
		try {		
			if (!refreshToken) throw new AuthError('Refresh token missing')
			const storedToken = await RefreshToken.findOne({ refreshToken })
			if (!storedToken) throw new AuthError('Invalid refresh token')
			await RefreshToken.findByIdAndDelete(storedToken._id)
			const {ttlSeconds} = generateBlacklistData(expirationTimestamp)
			if (ttlSeconds > 0) {
				const blacklistResult = await redisAddBreaker.fire(tokenId, ttlSeconds)
				logger.info(`[${redisAddBreaker.name}] fire() completed for logout.
				 			Result: ${blacklistResult}`)				
			} else {
				logger.warn('Logout requested for already expired token')	
			}			
			res.cookie('refreshToken', '', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				expires: new Date(0)
			});						
			return res.status(204).send()
		} catch (error) {			
			if (error instanceof CustomError) {
				next(error)
			}else{
				next(new ServerError('An internal server error occurred', { cause: error }))
			}			
		}
	}
)

module.exports = router;
