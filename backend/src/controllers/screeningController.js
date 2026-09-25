// Screening controller
import * as screeningService from '../services/screeningService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createScreening(req, res, next) {
  try {
    const screening = await screeningService.createScreening(req.body);
    res.status(201).json({ success: true, data: screening });
  } catch (err) {
    if (err.message === 'User not found') {
      return next(new AppError(err.message, 404, 'USER_NOT_FOUND'));
    }
    if (err.message === 'Camp not found') {
      return next(new AppError(err.message, 404, 'CAMP_NOT_FOUND'));
    }
    if (err.message === 'Worker not found') {
      return next(new AppError(err.message, 404, 'WORKER_NOT_FOUND'));
    }
    if (err.message.includes('required')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function getScreeningById(req, res, next) {
  try {
    const screening = await screeningService.getScreeningById(req.params.id);
    if (!screening) {
      return next(new AppError('Screening not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: screening });
  } catch (err) {
    next(err);
  }
}

export async function getAllScreenings(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const user_id = req.query.user_id;
    const camp_id = req.query.camp_id;
    const worker_id = req.query.worker_id;
    const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const from_date = req.query.from_date;
    const to_date = req.query.to_date;

    const screenings = await screeningService.getAllScreenings({
      limit,
      offset,
      user_id,
      camp_id,
      worker_id,
      is_active,
      from_date,
      to_date,
    });
    res.json({ success: true, data: screenings, count: screenings.length });
  } catch (err) {
    next(err);
  }
}

export async function getScreeningsByUserId(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const from_date = req.query.from_date;
    const to_date = req.query.to_date;

    const screenings = await screeningService.getScreeningsByUserId(req.params.userId, {
      limit,
      offset,
      is_active,
      from_date,
      to_date,
    });
    res.json({ success: true, data: screenings, count: screenings.length });
  } catch (err) {
    next(err);
  }
}

export async function getScreeningsByCampId(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const from_date = req.query.from_date;
    const to_date = req.query.to_date;

    const screenings = await screeningService.getScreeningsByCampId(req.params.campId, {
      limit,
      offset,
      is_active,
      from_date,
      to_date,
    });
    res.json({ success: true, data: screenings, count: screenings.length });
  } catch (err) {
    next(err);
  }
}

export async function getScreeningsByWorkerId(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const from_date = req.query.from_date;
    const to_date = req.query.to_date;

    const screenings = await screeningService.getScreeningsByWorkerId(req.params.workerId, {
      limit,
      offset,
      is_active,
      from_date,
      to_date,
    });
    res.json({ success: true, data: screenings, count: screenings.length });
  } catch (err) {
    next(err);
  }
}

export async function updateScreening(req, res, next) {
  try {
    const screening = await screeningService.updateScreening(req.params.id, req.body);
    if (!screening) {
      return next(new AppError('Screening not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: screening });
  } catch (err) {
    if (err.message === 'Camp not found') {
      return next(new AppError(err.message, 404, 'CAMP_NOT_FOUND'));
    }
    if (err.message === 'Worker not found') {
      return next(new AppError(err.message, 404, 'WORKER_NOT_FOUND'));
    }
    if (err.message.includes('No valid fields')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function deactivateScreening(req, res, next) {
  try {
    const screening = await screeningService.deactivateScreening(req.params.id);
    if (!screening) {
      return next(new AppError('Screening not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: screening, message: 'Screening deactivated' });
  } catch (err) {
    next(err);
  }
}

export default {
  createScreening,
  getScreeningById,
  getAllScreenings,
  getScreeningsByUserId,
  getScreeningsByCampId,
  getScreeningsByWorkerId,
  updateScreening,
  deactivateScreening,
};