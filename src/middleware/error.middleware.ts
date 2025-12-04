// src/middlewares/error.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import HttpException from '../utils/HttpExecption.js';
import config from '../config/config.js';

export const errorMiddleware = (
    err: HttpException, 
    req: Request, 
    res: Response, 
    next: NextFunction // Argumen keempat ini menandakan Error Middleware
) => {
    // Tentukan status error:
    // Jika error kustom, gunakan statusnya. Jika tidak, gunakan 500 (Internal Server Error)
    const status = err.status || 500;
    
    // Tentukan pesan error:
    const message = err.message || 'Something went wrong';

    // Log error stack trace (hanya di development)
    if (config.env === 'development') {
        console.error(`[Error]: ${req.method} ${req.path}`, err.stack);
    }

    // Kirim response error yang terstruktur
    res.status(status).json({
        success: false,
        status,
        message,
        // Di lingkungan development, kirim stack trace untuk debugging
        stack: config.env === 'development' ? err.stack : undefined, 
    });
};