import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

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

// File transports (hanya untuk production)
if (process.env.NODE_ENV === 'production') {
  // Error logs - rotate daily
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d', // Keep logs for 30 days
      maxSize: '20m', // Max file size 20MB
      format: prodFormat,
    })
  );

  // Combined logs - rotate daily
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // Keep logs for 14 days
      maxSize: '20m',
      format: prodFormat,
    })
  );

  // Access logs (HTTP requests)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxFiles: '7d', // Keep logs for 7 days
      maxSize: '20m',
      format: prodFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
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

// Helper functions untuk kemudahan penggunaan
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

export default logger;