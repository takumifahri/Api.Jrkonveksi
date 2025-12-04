import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
import Cors_Settings from './config/cors.js';

// Import routes (contoh)
// import userRoutes from './routes/user.routes.js';
// import contactRoutes from './routes/contact.routes.js';
// import materialRoutes from './routes/material.routes.js';

const app: Application = express();

// Security middleware
// app.use(helmet());

// CORS
app.use(cors(Cors_Settings));

// // Logging
// app.use(morgan('dev'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// app.use('/api/users', userRoutes);
// app.use('/api/contacts', contactRoutes);
// app.use('/api/materials', materialRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

export default app;