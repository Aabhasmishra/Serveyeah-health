// Error handling middleware
export class AppError extends Error {
  constructor(message, statusCode = 500, code, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, _req, res, _next) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
  }

  // PostgreSQL errors
  if (err.message && err.message.includes('duplicate key')) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Resource already exists',
        code: 'DUPLICATE_RESOURCE',
      },
    });
  }

  if (err.message && err.message.includes('foreign key')) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Referenced resource does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      },
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
}

export default { AppError, errorHandler, notFoundHandler };