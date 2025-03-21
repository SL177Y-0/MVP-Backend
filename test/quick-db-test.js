const mongoose = require('mongoose');
const { exit } = require('process');

const MONGO_URI = "mongodb+srv://rishiballabgarh23:123@mvp.z2uo0.mongodb.net/?retryWrites=true&w=majority&appName=MVP";

// Load models
const User = require('../models/User');
const Score = require('../models/Score');
const Wallet = require('../models/Wallet');

// Test results tracker
const results = { pass: 0, fail: 0, warnings: 0 };

async function log(test, status, message) {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${symbol} ${test}: ${message}`);
  results[status.toLowerCase()]++;
  if (status === 'WARNING') results.warnings++;
}

async function runTests() {
  console.log('🔍 RUNNING QUICK DATABASE TESTS\n');
  
  try {
    // Test 1: Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    await log('Connection', 'PASS', 'Connected to MongoDB');
    
    // Test 2: Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collNames = collections.map(c => c.name);
    await log('Collections', 'PASS', `Found ${collections.length} collections: ${collNames.join(', ')}`);
    
    // Test 3: Check indexes
    if (collNames.includes('users')) {
      const userIndexes = await mongoose.connection.db.collection('users').indexes();
      const hasPrivyIdIndex = userIndexes.some(idx => idx.key && idx.key.privyId === 1 && idx.unique);
      const emailIndexStatus = userIndexes.some(idx => 
        idx.key?.email === 1 && 
        idx.unique === true && 
        (idx.sparse === true || idx.partialFilterExpression?.email?.$type === 'string')
      ) ? 'PASS' : 'WARNING';
      
      await log('User Indexes', hasPrivyIdIndex ? 'PASS' : 'FAIL', 
        hasPrivyIdIndex ? 'Found unique privyId index' : 'Missing unique privyId index');
      await log('Email Index', emailIndexStatus, 
        emailIndexStatus === 'PASS' ? 'Email index properly configured' : 'Email index may allow duplicate null values');
    }
    
    // Test 4: Quick schema validation
    const testUser = new User({
      privyId: `test-${Date.now()}`,
      username: 'testuser',
      email: `test-${Date.now()}@example.com`
    });
    
    try {
      await testUser.validate();
      await log('User Schema', 'PASS', 'User schema validation passed');
    } catch (err) {
      await log('User Schema', 'FAIL', `Schema validation failed: ${err.message}`);
    }
    
    // Test 5: Check data consistency
    const userCount = await User.countDocuments();
    const scoreCount = await Score.countDocuments();
    const consistencyStatus = Math.abs(userCount - scoreCount) > userCount * 0.1 ? 'WARNING' : 'PASS';
    
    await log('Data Consistency', consistencyStatus, 
      `Users: ${userCount}, Scores: ${scoreCount} (${Math.abs(userCount - scoreCount)} difference)`);
    
    // Test 6: Check for orphaned records
    if (collNames.includes('wallets') && userCount > 0) {
      const walletsWithoutUsers = await Wallet.countDocuments({
        userId: { $nin: await User.find().distinct('_id') }
      });
      
      const walletStatus = walletsWithoutUsers > 0 ? 'WARNING' : 'PASS';
      await log('Wallet Integrity', walletStatus, 
        walletStatus === 'PASS' ? 'No orphaned wallet records' : `Found ${walletsWithoutUsers} orphaned wallet records`);
    }
    
  } catch (error) {
    await log('Test Execution', 'FAIL', `Error: ${error.message}`);
  } finally {
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log(`Passed: ${results.pass}, Failed: ${results.fail}, Warnings: ${results.warnings}`);
    
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the tests
runTests()
  .then(() => exit(results.fail > 0 ? 1 : 0))
  .catch(err => {
    console.error('Test runner error:', err);
    exit(1);
  }); 