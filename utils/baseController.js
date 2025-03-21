const { catchAsync } = require('./errorHandler');

class BaseController {
  constructor() {
    // Bind methods to ensure 'this' context
    this.sendSuccess = this.sendSuccess.bind(this);
    this.sendError = this.sendError.bind(this);
    this.wrapAsync = this.wrapAsync.bind(this);
  }

  // Send success response
  sendSuccess(res, data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      ...data
    });
  }

  // Send error response
  sendError(res, message, statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }

  // Wrap controller methods with error handling
  wrapAsync(fn) {
    return catchAsync(fn);
  }
}

module.exports = BaseController; 