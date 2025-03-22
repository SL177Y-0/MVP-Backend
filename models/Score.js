const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema({
    privyId: { type: String, required: true, unique: true },
    username: { type: String, default: null },
    email: { type: String },
    twitterScore: { type: Number, default: 0 },
    telegramScore: { type: Number, default: 0 },  
    totalScore: { type: Number, default: 0 },  
    wallets: [
        {
            walletAddress: { type: String, required: true },
            score: { type: Number, required: true, default: 10 },
            chainId: { type: String },
            lastUpdated: { type: Date, default: Date.now }
        }
    ],
    badges: { type: [String], default: [] },
    lastScoreUpdate: { type: Date, default: Date.now }
}, { 
    timestamps: true 
});

// Add indexes for common query fields
ScoreSchema.index({ totalScore: -1 }, { background: true }); // For leaderboards
ScoreSchema.index({ 'wallets.walletAddress': 1 }, { background: true, sparse: true });
ScoreSchema.index({ username: 1 }, { background: true, sparse: true });
ScoreSchema.index({ lastScoreUpdate: -1 }, { background: true }); // For recent updates

// Create a proper unique index for email that only applies to non-null values
// This is a better approach than sparse:true for handling null emails
ScoreSchema.index(
  { email: 1 }, 
  { 
    unique: true, 
    background: true,
    partialFilterExpression: { email: { $type: "string" } }  // Only apply uniqueness to non-null, non-undefined emails
  }
);

module.exports = mongoose.model("Score", ScoreSchema);
