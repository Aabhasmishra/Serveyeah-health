// Worker controller
import * as workerService from '../services/workerService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createWorker(req, res, next) {
  try {
    const worker = await workerService.createWorker(req.body);
    res.status(201).json({ success: true, data: worker });
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('already registered')) {
      return next(new AppError(err.message, 409, 'CONFLICT'));
    }
    if (err.message.includes('required')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function getWorkerById(req, res, next) {
  try {
    const worker = await workerService.getWorkerById(req.params.id);
    if (!worker) {
      return next(new AppError('Worker not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: worker });
  } catch (err) {
    next(err);
  }
}

export async function getAllWorkers(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const activeOnly = req.query.activeOnly === 'true';
    const workers = await workerService.getAllWorkers({ limit, offset, activeOnly });
    res.json({ success: true, data: workers, count: workers.length });
  } catch (err) {
    next(err);
  }
}

export async function updateWorker(req, res, next) {
  try {
    const worker = await workerService.updateWorker(req.params.id, req.body);
    if (!worker) {
      return next(new AppError('Worker not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: worker });
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('already registered')) {
      return next(new AppError(err.message, 409, 'CONFLICT'));
    }
    if (err.message.includes('No valid fields')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function deactivateWorker(req, res, next) {
  try {
    const worker = await workerService.deactivateWorker(req.params.id);
    if (!worker) {
      return next(new AppError('Worker not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: worker, message: 'Worker deactivated' });
  } catch (err) {
    next(err);
  }
}

export default {
  createWorker,
  getWorkerById,
  getAllWorkers,
  updateWorker,
  deactivateWorker,
};