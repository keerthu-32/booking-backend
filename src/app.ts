import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './config/logger';

// Routes
import authRoutes from './routes/auth.routes';
import flightRoutes from './routes/flight.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
const apiVersion = process.env.API_VERSION || 'v1';
const basePath = `/api/${apiVersion}`;

app.use(`${basePath}/auth`, authRoutes);
app.use(`${basePath}/flights`, flightRoutes);
app.use(`${basePath}/bookings`, bookingRoutes);
app.use(`${basePath}/payments`, paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Database connection and server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    //await connectDB();

    app.listen(PORT, () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
      logger.info(`✓ API available at http://localhost:${PORT}${basePath}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

export { app, startServer };

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}
