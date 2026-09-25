// Main server entry point
import express from 'express';
import cors from 'cors';
import { config } from './src/config/index.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import healthRoutes from './src/routes/health.js';
import userRoutes from './src/routes/users.js';
import workerRoutes from './src/routes/workers.js';
import campRoutes from './src/routes/camps.js';
import screeningRoutes from './src/routes/screenings.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/screenings', screeningRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.server.port;

function startServer() {
  try {
    // Validate config synchronously
    const missing = [];
    if (!config.db.host) missing.push('DB_HOST');
    if (!config.db.user) missing.push('DB_USER');
    if (!config.db.password) missing.push('DB_PASSWORD');
    if (!config.db.name) missing.push('DB_NAME');
    
    if (missing.length > 0) {
      console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
      console.warn('   Database connection will fail. Please fill in .env file.');
    } else {
      console.log('Configuration validated');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { closePool } = await import('./src/db/pool.js');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const { closePool } = await import('./src/db/pool.js');
  await closePool();
  process.exit(0);
});

startServer();

export default app;