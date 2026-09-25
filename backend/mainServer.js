// Main server entry point
import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
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

// Ports
const PORT = config.server.port;        // HTTP (existing — currently 5000)
const HTTPS_PORT = 5001;                // HTTPS (new)

// SSL certificate paths (do not modify or generate)
const SSL_KEY_PATH = '/etc/ssl/fintr/fintr.in.key';
const SSL_CERT_PATH = '/etc/ssl/fintr/fintr_in.crt';

// Track servers for graceful shutdown
let httpServer = null;
let httpsServer = null;

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
    });

    // ----- HTTPS server (port 5001) -----
    let sslOptions;
    try {
      sslOptions = {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      };
    } catch (err) {
      console.error('❌ Failed to read SSL certificate files:');
      console.error(`   Key:  ${SSL_KEY_PATH}`);
      console.error(`   Cert: ${SSL_CERT_PATH}`);
      console.error(`   Error: ${err.message}`);
      // Exit rather than silently starting without HTTPS
      if (httpServer) httpServer.close();
      process.exit(1);
    }

    httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🚀 HTTPS server running on https://localhost:${HTTPS_PORT}`);
      console.log(`🔗 Health check (HTTPS): https://localhost:${HTTPS_PORT}/api/health`);
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

  // Close HTTPS server
  if (httpsServer) {
    await new Promise((resolve) => httpsServer.close(resolve));
    console.log('HTTPS server closed');
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
