/**
 * Validation utility using Joi
 * Provides schema validation for API requests
 */

const Joi = require('joi');

/**
 * Validation schemas for different API requests
 */
const schemas = {
  // User validation schema
  user: Joi.object({
    privyId: Joi.string().required(),
    email: Joi.string().email().allow(null, ''),
    username: Joi.string().allow(null, ''),
    walletAddress: Joi.string().allow(null, '')
  }),

  // Score calculation request validation
  scoreRequest: Joi.object({
    privyId: Joi.string().required(),
    username: Joi.string().allow(null, ''),
    twitterUsername: Joi.string().allow(null, ''),
    address: Joi.string().allow(null, ''),
    walletAddress: Joi.string().allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    walletAddresses: Joi.array().items(Joi.string()),
    userDid: Joi.string().allow(null, ''),
    authToken: Joi.string().allow(null, ''),
    veridaConnected: Joi.boolean(),
    veridaUserId: Joi.string().allow(null, ''),
    twitterConnected: Joi.boolean(),
    walletConnected: Joi.boolean()
  }),

  // Wallet connection validation
  walletConnect: Joi.object({
    privyId: Joi.string().required(),
    walletAddress: Joi.string().required(),
    walletAddresses: Joi.array().items(Joi.string())
  }),
  
  // Verida connection validation
  veridaConnect: Joi.object({
    privyId: Joi.string().required(),
    userDid: Joi.string().required(),
    authToken: Joi.string().required()
  })
};

/**
 * Validation middleware generator
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.details[0].message,
        path: error.details[0].path
      }
    });
  }
  
  next();
};

module.exports = {
  schemas,
  validate
}; 