// Camp controller
import * as campService from '../services/campService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createCamp(req, res, next) {
  try {
    const camp = await campService.createCamp(req.body);
    res.status(201).json({ success: true, data: camp });
  } catch (err) {
    if (err.message.includes('does not exist')) {
      return next(new AppError(err.message, 404, 'WORKER_NOT_FOUND'));
    }
    if (err.message.includes('required')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function getCampById(req, res, next) {
  try {
    const camp = await campService.getCampById(req.params.id);
    if (!camp) {
      return next(new AppError('Camp not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: camp });
  } catch (err) {
    next(err);
  }
}

export async function getAllCamps(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const activeOnly = req.query.activeOnly === 'true';
    const camps = await campService.getAllCamps({ limit, offset, activeOnly });
    res.json({ success: true, data: camps, count: camps.length });
  } catch (err) {
    next(err);
  }
}

export async function updateCamp(req, res, next) {
  try {
    const camp = await campService.updateCamp(req.params.id, req.body);
    if (!camp) {
      return next(new AppError('Camp not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: camp });
  } catch (err) {
    if (err.message.includes('No valid fields')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function deactivateCamp(req, res, next) {
  try {
    const camp = await campService.deactivateCamp(req.params.id);
    if (!camp) {
      return next(new AppError('Camp not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: camp, message: 'Camp deactivated' });
  } catch (err) {
    next(err);
  }
}

export default {
  createCamp,
  getCampById,
  getAllCamps,
  updateCamp,
  deactivateCamp,
};