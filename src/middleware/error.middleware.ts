import type { Request, Response, NextFunction } from 'express';
import HttpException from '../utils/HttpExecption.js';
import logger from '../utils/logger.js';

export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // ✅ Check multiple ways
    const isHttpException = 
        error instanceof HttpException ||
        error.isHttpException === true ||
        (error.status && typeof error.status === 'number' && error.status < 600);

    if (isHttpException) {
        const status = error.status || 500;
        const message = error.message || 'Internal Server Error';

        logger.error('Handled error', {
            error: message,
            status: status,
            method: req.method,
            url: req.url,
            ip: req.ip
        });

        return res.status(status).json({
            status: status,
            message: message
        });
    }

    // ✅ Unhandled errors jadi 500
    logger.error('Unhandled error', {
        error: error.message || 'Unknown error',
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip
    });

    return res.status(500).json({
        status: 500,
        message: 'Internal Server Error'
    });
};