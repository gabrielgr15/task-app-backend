interface CustomErrorOptions {
    cause?:unknown
}

export class CustomError extends Error {
    public readonly status: number;
    public readonly cause?: unknown
    constructor(name: string, status: number, message: string, options?:CustomErrorOptions){
        super(message)
        this.name = name
        this.status = status
        if (options?.cause) {
            this.cause = options.cause;
        }
        if(Error.captureStackTrace){
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export class AuthError extends CustomError {
    constructor(message:string, options?:CustomErrorOptions){
        super('AuthenticationError', 401, message, options)
    }
}

export class ServerError extends CustomError {
    constructor(message:string, options?:CustomErrorOptions){
        super('ServerError', 500, message, options)
    }
}


export class ConflictError extends CustomError {
    constructor(message:string, options?:CustomErrorOptions){
        super('ConflictError', 409, message, options)
    }

}

export class BadRequest extends CustomError {
    constructor(message:string, options?:CustomErrorOptions){
        super('BadRequest', 400, message, options)
    }
}

export class NotFound extends CustomError {
    constructor(message:string, options?:CustomErrorOptions){
        super('NotFound', 404, message, options)
    }
}

export class ForbiddenError extends CustomError {
    constructor(message:string, options?:CustomErrorOptions){
        super('ForbiddenError', 403, message, options)
    }
}

