const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  privyId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: { 
    type: String, 
    default: null 
  },
  email: { 
    type: String,
  },
  twitterConnected: {
    type: Boolean,
    default: false
  },
  twitterUsername: String,
  twitterVerified: { 
    type: Boolean, 
    default: false 
  },
  walletConnected: {
    type: Boolean,
    default: false
  },
  walletAddress: {
    type: String,
    default: null
  },
  veridaConnected: { 
    type: Boolean, 
    default: false 
  },
  veridaUserId: String,
  totalScore: {
    type: Number,
    default: 0
  },
  scoreDetails: {
    twitterScore: {
      type: Number,
      default: 0
    },
    walletScore: {
      type: Number,
      default: 0
    },
    veridaScore: {
      type: Number,
      default: 0
    },
    twitterDetails: {
      type: Object,
      default: {}
    },
    walletDetails: {
      type: Object,
      default: {}
    },
    veridaDetails: {
      type: Object,
      default: {}
    }
  },
  lastScoreUpdate: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedTask: {
    type: Object
  }
}, {
  timestamps: true,
  versionKey: false,
  minimize: false // Ensure empty objects are stored
});

// Update the updatedAt field on each save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Keep User and Score data in sync
UserSchema.post('save', async function() {
  try {
    const Score = mongoose.model('Score');
    const existingScore = await Score.findOne({ privyId: this.privyId });
    
    if (existingScore) {
      // Update score record if user changed
      await Score.findOneAndUpdate(
        { privyId: this.privyId },
        { 
          username: this.username,
          email: this.email,
          twitterScore: this.scoreDetails?.twitterScore || existingScore.twitterScore,
          totalScore: this.totalScore || existingScore.totalScore
        }
      );
    } else {
      // Create new score record if none exists
      const newScore = new Score({
        privyId: this.privyId,
        username: this.username,
        email: this.email,
        twitterScore: this.scoreDetails?.twitterScore || 0,
        telegramScore: 0,
        totalScore: this.totalScore || 0,
        wallets: this.walletAddress ? [{ 
          walletAddress: this.walletAddress,
          score: this.scoreDetails?.walletScore || 10
        }] : []
      });
      await newScore.save();
    }
  } catch (error) {
    console.error(`Error syncing user ${this.privyId} with score:`, error);
  }
});

// Clear any pre-existing email indexes to avoid duplicates
UserSchema.indexes().forEach(index => {
  if (index[0].email !== undefined) {
    UserSchema.index(index[0], { ...index[1], background: true, name: 'email_old_' + Date.now() });
  }
});

// Define a single email uniqueness index with proper partial filter expression
// This ensures only non-null string emails are considered for uniqueness
UserSchema.index(
  { email: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { email: { $type: "string" } },
    background: true,
    name: 'email_unique'
  }
);

// Add indexes for common query fields
UserSchema.index({ walletAddress: 1 }, { sparse: true, background: true });
UserSchema.index({ twitterUsername: 1 }, { sparse: true, background: true });
UserSchema.index({ veridaUserId: 1 }, { sparse: true, background: true });
UserSchema.index({ totalScore: -1 }, { background: true }); // For leaderboards

module.exports = mongoose.model("User", UserSchema); 