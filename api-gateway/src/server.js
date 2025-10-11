//require('dotenv').config()
const express = require("express");
const logger = require("./config/logger");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
const authenticateToken = require("./middleware/auth");
const {
  handleExpressProxyError,
  decorateProxyReq,
} = require("./utils/proxyUtils");
const proxy = require("express-http-proxy");
const { initializeRedis } = require("./services/redisClient");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const app = express();

module.exports = app;

const PORT = process.env.PORT;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const TASKS_SERVICE_URL = process.env.TASKS_SERVICE_URL;
const ACTIVITY_SERVICE_URL = process.env.ACTIVITY_SERVICE_URL;

if (!USER_SERVICE_URL || !TASKS_SERVICE_URL || !ACTIVITY_SERVICE_URL) {
  logger.error(
    "FATAL ERROR: Service urls {USER_SERVICE_URL, TASK_SERVICE_URL, ACTIVITY_SERVICE_URL} are not defined in .env file"
  );
  process.exit(1);
}

let globalLimiter = null;
let authLimiter = null;

if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development'){
  globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  });

  authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: `Too many login/ registration attempts.Try again later.ENV = ${ process.env.NODE_ENV }`
  });
}

const authMiddleware = [];
if (authLimiter) {
  authMiddleware.push(authLimiter);
}

async function startServer() {
  await initializeRedis();

  const corsOptions = {
    origin: [
      "http://localhost:3000",
      "https://tasks-app-frontend-nine.vercel.app",
    ],
    credentials: true,
  };
  app.set("trust proxy", true);
  app.use(helmet());
  if (globalLimiter) {
    app.use(globalLimiter);
  }
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.get("/health", (req, res) => {
    res.status(200).send("Api Gateway OK");
  });
  app.use('/api/activity', (req, res, next) => {
    // Log in the background without awaiting
    setImmediate(() => {
      logger.info('Activity request:', {
        timestamp: new Date().toISOString(),
        originalUrl: req.originalUrl,
        serviceUrl: process.env.ACTIVITY_SERVICE_URL,
        hasAuth: !!req.headers.authorization,
      });
    });
    next();
  });
  app.use(
    [
      "/api/users/auth/register",
      "/api/users/auth/login",
      "/api/users/auth/refresh",
    ],
    authMiddleware,
    proxy(USER_SERVICE_URL, {
    timeout: 30000,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: handleExpressProxyError,
  })
  )
  app.use('/api/users/auth/logout', authenticateToken, proxy(USER_SERVICE_URL, {
    timeout: 30000,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: handleExpressProxyError,
    proxyReqOptDecorator: decorateProxyReq
  }))
  app.use('/api/activity', authenticateToken, proxy(ACTIVITY_SERVICE_URL, {
    timeout: 30000,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: handleExpressProxyError,
    proxyReqOptDecorator: decorateProxyReq
  }))
  app.use('/api/tasks', authenticateToken, proxy(TASKS_SERVICE_URL, {
    timeout: 30000,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: handleExpressProxyError,
    proxyReqOptDecorator: decorateProxyReq
  }))
  app.use(errorHandler)
  const server = app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
  });
}
startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("!!! UNHANDLED REJECTION !!!", { reason: reason });
});
process.on("uncaughtException", (error) => {
  logger.error("!!! UNCAUGHT EXCEPTION !!!", error);
  process.exit(1);
});
