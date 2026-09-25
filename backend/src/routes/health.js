// Health check route
import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  
  try {
    await query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
  });
});

export default router;