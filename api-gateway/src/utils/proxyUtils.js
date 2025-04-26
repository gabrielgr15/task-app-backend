const logger = require('../config/logger');
const { ServerError } = require('../errors');


function handleExpressProxyError (err, res, next) {            
    logger.error(`PROXY ERROR (express-http-proxy):`, {
        code: err.code,
        message: err.message
    })            
    if (!res.headersSent) {        
        const statusCode = err.code === 'ECONNREFUSED' ? 503 
                         : err.code === 'ETIMEDOUT' ? 504    
                         : 502                           
        res.status(statusCode).json({ message: 'Service Error or Unavailable' });
    }
}

const decorateProxyReq = (proxyReqOpts, srcReq) => {        
    proxyReqOpts.headers = proxyReqOpts.headers || {};
    delete proxyReqOpts.headers['authorization'] 

    if (!srcReq.user || !srcReq.user.id || !srcReq.token || !srcReq.tokenExpiry) {
        logger.error('decorateProxyReq called without proper data', srcReq.user.id)
        throw new ServerError('Internal server error - Failed to prepare proxy request context.')
    }
    proxyReqOpts.headers['x-user-id'] = srcReq.user.id 
    proxyReqOpts.headers['x-token-id'] = srcReq.token    
    proxyReqOpts.headers['x-token-expiry'] = srcReq.tokenExpiry
    return proxyReqOpts 
      
}

module.exports = {
    handleExpressProxyError,
    decorateProxyReq 
};

