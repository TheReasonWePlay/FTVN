import { Request, Response, NextFunction } from "express";
import { AppError, formatErrorResponse } from "../utils/errors";

const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let appError: AppError;

    if (err instanceof AppError) {
        appError = err;
    } else {
        const message =
            err instanceof Error ? err.message : "Erreur serveur";
        appError = new AppError(message, 500, false);
    }

    if (process.env.NODE_ENV === "development") {
        console.error(appError);
    }

    res.status(appError.statusCode).json(formatErrorResponse(appError));
};

export default errorHandler;
