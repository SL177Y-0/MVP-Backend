/**
 * Token Service
 * Provides a secure way to manage auth tokens
 * Uses MongoDB for storage instead of global variables
 */

const mongoose = require('mongoose');

// MongoDB Schema for tokens
const TokenSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  token: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24*60*60*1000) // 24 hours
  }
});

// Create the model if it doesn't exist
const Token = mongoose.models.Token || mongoose.model('Token', TokenSchema);

/**
 * Store an authentication token
 * @param {string} userId - The user ID
 * @param {string} token - The authentication token
 * @param {number} expiryHours - Token expiry in hours (default: 24)
 * @returns {Promise<boolean>} Success status
 */
const storeAuthToken = async (userId, token, expiryHours = 24) => {
  if (!userId || !token) {
    throw new Error('User ID and token are required');
  }
  
  await Token.findOneAndUpdate(
    { userId }, 
    { 
      token,
      expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000)
    },
    { upsert: true }
  );
  
  return true;
};

/**
 * Get an authentication token
 * @param {string} userId - The user ID
 * @returns {Promise<string>} The authentication token
 */
const getAuthToken = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required to get auth token');
  }
  
  const tokenDoc = await Token.findOne({ 
    userId,
    expiresAt: { $gt: new Date() } // Only return non-expired tokens
  });
  
  if (!tokenDoc) {
    throw new Error(`No valid auth token found for user ${userId}`);
  }
  
  return tokenDoc.token;
};

/**
 * Delete an authentication token
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
const deleteAuthToken = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required to delete auth token');
  }
  
  await Token.deleteOne({ userId });
  return true;
};

/**
 * Check if a token exists and is valid
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the token is valid
 */
const hasValidToken = async (userId) => {
  if (!userId) return false;
  
  const count = await Token.countDocuments({ 
    userId,
    expiresAt: { $gt: new Date() }
  });
  
  return count > 0;
};

module.exports = {
  storeAuthToken,
  getAuthToken,
  deleteAuthToken,
  hasValidToken
}; 