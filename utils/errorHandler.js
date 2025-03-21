/**
 * Custom error class for application errors
 * Allows for standardized error handling with status codes
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async function wrapper to catch errors
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = fn => {
  return (req, res, next) => {
    // Check if fn returns a Promise before calling catch
    const result = fn(req, res, next);
    if (result && typeof result.catch === 'function') {
      return result.catch(err => {
        console.error(`Error caught by catchAsync: ${err.message}`);
        next(err);
      });
    }
    return result;
  };
};

/**
 * Global error handler for the application
 * @param {Error} err - The error object
 * @param {Object} res - Express response object
 */
const handleError = (err, res) => {
  const { statusCode = 500, message } = err;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? 'Internal server error' : message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = {
  AppError,
  catchAsync,
  handleError
}; 