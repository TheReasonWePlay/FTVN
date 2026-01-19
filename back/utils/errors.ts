export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, 500);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string) {
        super(message, 401);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string) {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} non trouvé`, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

export const handleDatabaseError = (error: any): AppError => {
    // Handle MySQL specific errors
    if (error.code === 'ER_DUP_ENTRY') {
        return new ConflictError('Un enregistrement avec ces données existe déjà');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return new ValidationError('Référence invalide');
    }
    if (error.code === 'ER_DATA_TOO_LONG') {
        return new ValidationError('Données trop longues pour ce champ');
    }

    return new DatabaseError('Erreur de base de données');
};

export const formatErrorResponse = (error: AppError) => {
    return {
        success: false,
        error: {
            message: error.message,
            statusCode: error.statusCode,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    };
};
