import { Request, Response, NextFunction } from "express";

interface HttpError extends Error {
    status?: number;
    statusCode?: number;
}

export function errorHandler(
    err: HttpError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        status: "error",
        message,
    });
}
