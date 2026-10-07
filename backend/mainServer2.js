// mainServer2.js
// Local Windows development/testing entry point — HTTP only, no SSL.
// Mirrors mainServer.js behavior minus the HTTPS listener and SSL cert loading.
// Do not deploy this file to production.

import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './src/config/index.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import healthRoutes from './src/routes/health.js';
import userRoutes from './src/routes/users.js';
import workerRoutes from './src/routes/workers.js';
import campRoutes from './src/routes/camps.js';
import screeningRoutes from './src/routes/screenings.js';
import surveyRoutes from './src/routes/surveys.js';

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
// Household survey module. Mounted under /household so the public paths read
// POST /api/surveys/household/ and GET /api/surveys/household/stats/.
app.use('/api/surveys/household', surveyRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Port (HTTP only — local development)
const PORT = config.server.port; // HTTP (currently 5000)

// Track server for graceful shutdown
let httpServer = null;

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

    // ----- HTTP server (port 5000) -----
    httpServer = http.createServer(app);
    httpServer.listen(PORT, () => {
      console.log(`🚀 HTTP  server running on http://localhost:${PORT}`);
      console.log(`🔗 Health check (HTTP):  http://localhost:${PORT}/api/health`);
      console.log('🪟  Local Windows development mode (HTTP only, no SSL)');
    });

    console.log(`📡 Environment: ${config.server.nodeEnv}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);

  // Close HTTP server
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    console.log('HTTP server closed');
  }

  // Close DB pool
  try {
    const { closePool } = await import('./src/db/pool.js');
    await closePool();
  } catch (err) {
    console.error('Error closing DB pool:', err.message);
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

export default app;