const axios = require('axios');
const mongoose = require('mongoose');
const assert = require('assert');
const { exit } = require('process');

// Models
const User = require('../models/User');
const Score = require('../models/Score');
const Wallet = require('../models/Wallet');

// Configuration
const API_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const MONGO_URI = "mongodb+srv://rishiballabgarh23:123@mvp.z2uo0.mongodb.net/?retryWrites=true&w=majority&appName=MVP";

// Test results tracker
const testResults = {
  db: { pass: 0, fail: 0, warnings: 0 },
  api: { pass: 0, fail: 0, warnings: 0 },
  integration: { pass: 0, fail: 0, warnings: 0 },
  total: { pass: 0, fail: 0, warnings: 0 }
};

// Test data
const testUser = {
  privyId: `test-user-${Date.now()}`,
  username: 'testuser',
  email: `test-${Date.now()}@example.com`,
  walletAddress: `0xTest${Date.now().toString(16)}`,
  twitterUsername: 'testTwitterUser'
};

// Helper functions
async function log(category, test, status, message, data = {}) {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${symbol} [${category}] ${test}: ${message}`);
  
  if (status.toLowerCase() === 'pass') testResults[category].pass++;
  else if (status.toLowerCase() === 'fail') testResults[category].fail++;
  else if (status.toLowerCase() === 'warning') testResults[category].warnings++;
  
  // Update totals
  if (status.toLowerCase() === 'pass') testResults.total.pass++;
  else if (status.toLowerCase() === 'fail') testResults.total.fail++;
  else if (status.toLowerCase() === 'warning') testResults.total.warnings++;
  
  // Output detailed data for failures
  if (status.toLowerCase() === 'fail' && Object.keys(data).length > 0) {
    console.log(`   Details:`, data);
  }
}

// 1. Database Tests
async function testDatabaseConnection() {
  console.log('\n🔍 TESTING DATABASE CONNECTION AND SCHEMA\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    await log('db', 'Connection', 'PASS', 'Connected to MongoDB');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collNames = collections.map(c => c.name);
    await log('db', 'Collections', 'PASS', `Found ${collections.length} collections: ${collNames.join(', ')}`);
    
    // Check indexes on User collection
    if (collNames.includes('users')) {
      const userIndexes = await mongoose.connection.db.collection('users').indexes();
      const hasPrivyIdIndex = userIndexes.some(idx => idx.key && idx.key.privyId === 1 && idx.unique);
      const emailIndexStatus = userIndexes.some(idx => 
        idx.key?.email === 1 && 
        idx.unique === true && 
        (idx.sparse === true || idx.partialFilterExpression?.email?.$type === 'string')
      ) ? 'PASS' : 'WARNING';
      
      await log('db', 'User Indexes', hasPrivyIdIndex ? 'PASS' : 'FAIL', 
        hasPrivyIdIndex ? 'Found unique privyId index' : 'Missing unique privyId index');
      await log('db', 'Email Index', emailIndexStatus, 
        emailIndexStatus === 'PASS' ? 'Email index properly configured' : 'Email index may allow duplicate null values');
    }
    
    // Check data consistency
    const userCount = await User.countDocuments();
    const scoreCount = await Score.countDocuments();
    const consistencyStatus = Math.abs(userCount - scoreCount) > userCount * 0.1 ? 'WARNING' : 'PASS';
    
    await log('db', 'Data Consistency', consistencyStatus, 
      `Users: ${userCount}, Scores: ${scoreCount} (${Math.abs(userCount - scoreCount)} difference)`);
    
    return true;
  } catch (error) {
    await log('db', 'Database Tests', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// 2. API Health Check
async function testApiHealth() {
  console.log('\n🔍 TESTING API HEALTH\n');
  
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    
    if (response.status === 200 && response.data && response.data.status === 'ok') {
      await log('api', 'Health Check', 'PASS', 'API is healthy');
      return true;
    } else {
      await log('api', 'Health Check', 'FAIL', `API returned unexpected response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    await log('api', 'Health Check', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// 3. Test User Creation and Score Synchronization
async function testUserCreationAndSync() {
  console.log('\n🔍 TESTING USER CREATION AND SCORE SYNC\n');
  
  try {
    // Create test user in database
    const newUser = new User({
      privyId: testUser.privyId,
      username: testUser.username,
      email: testUser.email,
      walletAddress: testUser.walletAddress,
      twitterUsername: testUser.twitterUsername,
      walletConnected: true,
      twitterConnected: true
    });
    
    await newUser.save();
    await log('integration', 'User Creation', 'PASS', `Created test user with ID: ${testUser.privyId}`);
    
    // Verify user was created
    const savedUser = await User.findOne({ privyId: testUser.privyId });
    if (!savedUser) {
      await log('integration', 'User Verification', 'FAIL', 'Failed to find saved user');
      return false;
    }
    
    await log('integration', 'User Verification', 'PASS', 'Found saved user in database');
    
    // Verify score record was created (via post-save hook)
    const userScore = await Score.findOne({ privyId: testUser.privyId });
    
    if (!userScore) {
      await log('integration', 'Score Sync', 'FAIL', 'Score record was not created automatically');
      return false;
    }
    
    await log('integration', 'Score Sync', 'PASS', 'Score record was created automatically');
    
    // Check if wallet address was properly synced
    if (userScore.wallets && userScore.wallets.length > 0 && 
        userScore.wallets[0].walletAddress === testUser.walletAddress) {
      await log('integration', 'Wallet Sync', 'PASS', 'Wallet address was properly synced to score record');
    } else {
      await log('integration', 'Wallet Sync', 'WARNING', 'Wallet address was not properly synced to score record');
    }
    
    return true;
  } catch (error) {
    await log('integration', 'User Creation', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// 4. Test User Update and Score Synchronization
async function testUserUpdateAndSync() {
  console.log('\n🔍 TESTING USER UPDATE AND SCORE SYNC\n');
  
  try {
    // First, find the test user
    const user = await User.findOne({ privyId: testUser.privyId });
    
    if (!user) {
      await log('integration', 'User Update', 'FAIL', 'Test user not found for update test');
      return false;
    }
    
    // Update user information
    const updatedUsername = `${testUser.username}-updated`;
    user.username = updatedUsername;
    user.totalScore = 100;
    if (!user.scoreDetails) user.scoreDetails = {};
    user.scoreDetails.twitterScore = 50;
    user.scoreDetails.walletScore = 50;
    
    await user.save();
    await log('integration', 'User Update', 'PASS', `Updated user ${user.privyId} with new username and score`);
    
    // Verify score was updated
    const updatedScore = await Score.findOne({ privyId: testUser.privyId });
    
    if (!updatedScore) {
      await log('integration', 'Score Update', 'FAIL', 'Score record not found after update');
      return false;
    }
    
    // Check if username was updated in score record
    if (updatedScore.username === updatedUsername) {
      await log('integration', 'Username Sync', 'PASS', 'Username was properly synced to score record');
    } else {
      await log('integration', 'Username Sync', 'FAIL', 
        `Username was not synced correctly. Expected: ${updatedUsername}, Got: ${updatedScore.username}`);
    }
    
    // Check if score was updated
    if (updatedScore.totalScore === 100) {
      await log('integration', 'Score Value Sync', 'PASS', 'Total score was properly synced');
    } else {
      await log('integration', 'Score Value Sync', 'FAIL', 
        `Total score was not synced correctly. Expected: 100, Got: ${updatedScore.totalScore}`);
    }
    
    return true;
  } catch (error) {
    await log('integration', 'User Update', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// 5. Test Score API Endpoints
async function testScoreApi() {
  console.log('\n🔍 TESTING SCORE API ENDPOINTS\n');
  
  try {
    // Test API root endpoint
    const rootResponse = await axios.get(`${API_URL}/`);
    if (rootResponse.status === 200) {
      await log('api', 'Root Endpoint', 'PASS', 'Backend root endpoint is responding');
    } else {
      await log('api', 'Root Endpoint', 'FAIL', 'Backend root endpoint failed');
    }
    
    // Test total score endpoint
    try {
      console.log(`Testing total score endpoint for user: ${testUser.privyId}`);
      const totalScoreResponse = await axios.get(`${API_URL}/api/score/total-score/${testUser.privyId}`, {
        validateStatus: false // Don't throw on error status codes
      });
      
      console.log(`Total score response: ${totalScoreResponse.status}`);
      
      if (totalScoreResponse.status === 200) {
        await log('api', 'Total Score Endpoint', 'PASS', 'Total score endpoint works');
        console.log(`Response data: ${JSON.stringify(totalScoreResponse.data)}`);
      } else {
        console.error(`Error response: ${JSON.stringify(totalScoreResponse.data)}`);
        await log('api', 'Total Score Endpoint', 'FAIL', `Total score endpoint error: Status ${totalScoreResponse.status}`);
      }
    } catch (err) {
      console.error(`Exception in total score endpoint: ${err.stack}`);
      await log('api', 'Total Score Endpoint', 'FAIL', `Total score endpoint error: ${err.message}`);
    }
    
    return true;
  } catch (error) {
    await log('api', 'Score API', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// 6. Cleanup test data
async function cleanupTestData() {
  console.log('\n🧹 CLEANING UP TEST DATA\n');
  
  try {
    // Delete test user and related data
    await User.deleteOne({ privyId: testUser.privyId });
    await Score.deleteOne({ privyId: testUser.privyId });
    await Wallet.deleteMany({ walletAddress: testUser.walletAddress });
    
    console.log(`✅ Deleted test user and related data`);
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning up test data: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE BACKEND TESTS');
  console.log('====================================================\n');
  
  const startTime = Date.now();
  
  try {
    // First test database
    const dbResult = await testDatabaseConnection();
    if (!dbResult) {
      console.error('\n❌ DATABASE TESTS FAILED! Aborting further tests.');
      return;
    }
    
    // Then test API health
    const apiResult = await testApiHealth();
    if (!apiResult) {
      console.warn('\n⚠️ API HEALTH CHECK FAILED! Some tests may not work.');
    }
    
    // Run integration tests
    await testUserCreationAndSync();
    await testUserUpdateAndSync();
    
    // Run API endpoint tests
    await testScoreApi();
    
    // Finally, clean up test data
    await cleanupTestData();
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nDatabase connection closed');
    }
    
    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n====================================================');
    console.log('📊 TEST SUMMARY');
    console.log('====================================================');
    console.log(`Database Tests:      ✅ ${testResults.db.pass} | ❌ ${testResults.db.fail} | ⚠️ ${testResults.db.warnings}`);
    console.log(`API Tests:           ✅ ${testResults.api.pass} | ❌ ${testResults.api.fail} | ⚠️ ${testResults.api.warnings}`);
    console.log(`Integration Tests:   ✅ ${testResults.integration.pass} | ❌ ${testResults.integration.fail} | ⚠️ ${testResults.integration.warnings}`);
    console.log(`---------------------------------------------------`);
    console.log(`TOTAL:               ✅ ${testResults.total.pass} | ❌ ${testResults.total.fail} | ⚠️ ${testResults.total.warnings}`);
    console.log(`---------------------------------------------------`);
    console.log(`Duration: ${duration} seconds`);
    console.log('====================================================');
    
    // Return exit code based on test results
    exit(testResults.total.fail > 0 ? 1 : 0);
  }
}

// Start tests
runAllTests(); 