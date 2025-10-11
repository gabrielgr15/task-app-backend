"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.NotFound = exports.BadRequest = exports.ConflictError = exports.ServerError = exports.AuthError = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(name, status, message, options) {
        super(message);
        this.name = name;
        this.status = status;
        if (options === null || options === void 0 ? void 0 : options.cause) {
            this.cause = options.cause;
        }
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.CustomError = CustomError;
class AuthError extends CustomError {
    constructor(message, options) {
        super('AuthenticationError', 401, message, options);
    }
}
exports.AuthError = AuthError;
class ServerError extends CustomError {
    constructor(message, options) {
        super('ServerError', 500, message, options);
    }
}
exports.ServerError = ServerError;
class ConflictError extends CustomError {
    constructor(message, options) {
        super('ConflictError', 409, message, options);
    }
}
exports.ConflictError = ConflictError;
class BadRequest extends CustomError {
    constructor(message, options) {
        super('BadRequest', 400, message, options);
    }
}
exports.BadRequest = BadRequest;
class NotFound extends CustomError {
    constructor(message, options) {
        super('NotFound', 404, message, options);
    }
}
exports.NotFound = NotFound;
class ForbiddenError extends CustomError {
    constructor(message, options) {
        super('ForbiddenError', 403, message, options);
    }
}
exports.ForbiddenError = ForbiddenError;
