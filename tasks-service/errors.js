class CustomError extends Error {
    constructor(name, status, message, options){
        super(message, options)
        this.name = name
        this.status = status
        if (options && options.cause) {
            this.cause = options.cause;
        }
    }
}

class AuthError extends CustomError {
    constructor(message, options){
        super('AuthenticationError', 401, message, options)
    }
}

class ServerError extends CustomError {
    constructor(message, options){
        super('ServerError', 500, message, options)
    }
}

class ValidationError extends CustomError {
    constructor(message, validationErrors, options){
        super('ValidationError',400, message, options)
        this.validationErrors  = validationErrors 
    }
}

class ConflictError extends CustomError {
    constructor(message, options){
        super('ConflictError', 409, message, options)
    }

}

class BadRequest extends CustomError {
    constructor(message, options){
        super('BadRequest', 400, message, options)
    }
}

class NotFound extends CustomError {
    constructor(message, options){
        super('NotFound', 404, message, options)
    }
}

class ForbiddenError extends CustomError {
    constructor(message, options){
        super('ForbiddenError', 403, message, options)
    }
}


module.exports = {
    CustomError,
    AuthError,
    ServerError,
    ValidationError,
    ConflictError,
    BadRequest,
    NotFound,
    ForbiddenError,
}