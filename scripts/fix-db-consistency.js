const mongoose = require('mongoose');
const User = require('../models/User');
const Score = require('../models/Score');

const MONGO_URI = "mongodb+srv://rishiballabgarh23:123@mvp.z2uo0.mongodb.net/?retryWrites=true&w=majority&appName=MVP";

async function fixDataConsistency() {
  console.log('🔧 FIXING DATABASE CONSISTENCY\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find scores without matching users
    const allScores = await Score.find({}, 'privyId');
    const allUsers = await User.find({}, 'privyId');
    
    const userPrivyIds = new Set(allUsers.map(user => user.privyId));
    const scorePrivyIds = allScores.map(score => score.privyId);
    
    const orphanedScores = scorePrivyIds.filter(id => !userPrivyIds.has(id));
    
    console.log(`Found ${orphanedScores.length} scores without matching users`);
    
    // Delete orphaned scores
    if (orphanedScores.length > 0) {
      const deleteResult = await Score.deleteMany({ privyId: { $in: orphanedScores } });
      console.log(`Deleted ${deleteResult.deletedCount} orphaned score records`);
    }
    
    // Find users without scores
    const usersMissingScores = [];
    for (const user of allUsers) {
      const hasScore = await Score.findOne({ privyId: user.privyId });
      if (!hasScore) usersMissingScores.push(user);
    }
    
    console.log(`Found ${usersMissingScores.length} users without scores`);
    
    // Create missing score records
    if (usersMissingScores.length > 0) {
      for (const user of usersMissingScores) {
        const newScore = new Score({
          privyId: user.privyId,
          username: user.username,
          email: user.email,
          twitterScore: user.scoreDetails?.twitterScore || 0,
          telegramScore: 0,
          totalScore: user.totalScore || 0,
          wallets: user.walletAddress ? [{
            walletAddress: user.walletAddress,
            score: user.scoreDetails?.walletScore || 10
          }] : []
        });
        
        await newScore.save();
        console.log(`Created score record for user ${user.privyId}`);
      }
    }
    
    // Verify fix
    const finalUserCount = await User.countDocuments();
    const finalScoreCount = await Score.countDocuments();
    
    console.log('\n📊 FINAL COUNTS:');
    console.log(`Users: ${finalUserCount}, Scores: ${finalScoreCount}`);
    
    if (finalUserCount === finalScoreCount) {
      console.log('✅ SUCCESS: Users and Scores collections are now in sync');
    } else {
      console.log('⚠️ WARNING: Users and Scores counts still don\'t match');
      console.log('You may need to run additional fixes or check for other issues');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the fix
fixDataConsistency()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script execution error:', err);
    process.exit(1);
  }); 