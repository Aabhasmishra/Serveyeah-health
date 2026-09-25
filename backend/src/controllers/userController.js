// User controller
import * as userService from '../services/userService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.message.includes('already registered')) {
      return next(new AppError(err.message, 409, 'EMAIL_EXISTS'));
    }
    if (err.message.includes('required')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const activeOnly = req.query.activeOnly === 'true';
    const users = await userService.getAllUsers({ limit, offset, activeOnly });
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: user });
  } catch (err) {
    if (err.message.includes('already registered')) {
      return next(new AppError(err.message, 409, 'EMAIL_EXISTS'));
    }
    if (err.message.includes('No valid fields')) {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    }
    next(err);
  }
}

export async function deactivateUser(req, res, next) {
  try {
    const user = await userService.deactivateUser(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: user, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
}

export default {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deactivateUser,
};