import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Pastikan folder logs ada
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format untuk development
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Tambahkan metadata jika ada
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    
    // Tambahkan stack trace untuk error
    if (stack) {
        msg += `\n${stack}`;
    }
    
    return msg;
});

// Custom log format untuk production
const prodFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
);

// Konfigurasi transports
const transports: winston.transport[] = [];

// Console transport (untuk semua environment)
transports.push(
    new winston.transports.Console({
        format: combine(
            colorize({ all: true }),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            devFormat
        ),
    })
);

// File transports untuk DEVELOPMENT & PRODUCTION
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

if (isDevelopment || isProduction) {
    // Error logs - rotate daily
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: isProduction ? '30d' : '7d', // Production: 30 hari, Dev: 7 hari
            maxSize: '20m',
            format: isProduction ? prodFormat : devFormat,
            zippedArchive: isProduction, // Compress di production
        })
    );

    // Combined logs - rotate daily  
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: isProduction ? '14d' : '5d',
            maxSize: '20m', 
            format: isProduction ? prodFormat : devFormat,
            zippedArchive: isProduction,
        })
    );

    // HTTP Access logs
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'access-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            maxFiles: isProduction ? '7d' : '3d',
            maxSize: '20m',
            format: isProduction ? prodFormat : devFormat,
            zippedArchive: isProduction,
        })
    );

    // Debug logs (hanya development)
    if (isDevelopment) {
        transports.push(
            new DailyRotateFile({
                filename: path.join(logsDir, 'debug-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                level: 'debug',
                maxFiles: '3d',
                maxSize: '10m',
                format: devFormat,
            })
        );
    }
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format: isProduction ? prodFormat : devFormat,
    transports,
    exitOnError: false,
    silent: process.env.NODE_ENV === 'test', // Disable logs in test mode
});

// Stream untuk Morgan (HTTP logging)
export const morganStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// Helper functions
export const logError = (message: string, error?: Error | unknown, metadata?: object) => {
    if (error instanceof Error) {
        logger.error(message, { error: error.message, stack: error.stack, ...metadata });
    } else {
        logger.error(message, { error, ...metadata });
    }
};

export const logInfo = (message: string, metadata?: object) => {
    logger.info(message, metadata);
};

export const logWarn = (message: string, metadata?: object) => {
    logger.warn(message, metadata);
};

export const logDebug = (message: string, metadata?: object) => {
    logger.debug(message, metadata);
};

export const logHttp = (message: string, metadata?: object) => {
    logger.http(message, metadata);
};

// Tambahan: Log business events untuk audit
export const logAudit = (action: string, metadata?: object) => {
    logger.info(`[AUDIT] ${action}`, { type: 'audit', ...metadata });
};

export const logTransaction = (action: string, transactionId: number | number, metadata?: object) => {
    logger.info(`[TRANSACTION] ${action}`, { 
        type: 'transaction', 
        transaction_id: transactionId, 
        ...metadata 
    });
};

export const logPayment = (action: string, paymentData: object) => {
    logger.info(`[PAYMENT] ${action}`, { 
        type: 'payment', 
        ...paymentData 
    });
};

export default logger;