const logger = require('../config/logger')
const { verifyTokenAndCheckBlacklist } = require('../utils/jwtUtils')
const { ServerError, AuthError, CustomError} = require('../errors')


module.exports = async function (req, res, next) {
	const authHeader = req.header('Authorization')
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		next(new AuthError('No authorization token, access denied'))
	}
	try {
		const token = authHeader.split(' ')[1]		
		const decoded = await verifyTokenAndCheckBlacklist(token)
		req.user = decoded.user
		req.token = decoded.jti
		req.tokenExpiry = decoded.exp
		next();
	} catch (error) {
		if(error instanceof CustomError){
			next(error)
		}else{
			next(new ServerError('An internal server error occurred', {cause: error}))
		}		
	}	
}