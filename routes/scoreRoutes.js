const express = require("express");
const { CollectData } = require('../controllers/NewScoreController.js');
const { validate, schemas } = require('../utils/validation');
const { catchAsync } = require('../utils/errorHandler');
const Score = require('../models/Score');
const User = require('../models/User');

const router = express.Router();

// Redirect old GET endpoint to use the new controller
router.get("/get-score/:privyId/:username/:address", catchAsync(CollectData));

// Main endpoint for score calculation with validation
router.post("/get-score", validate(schemas.scoreRequest), catchAsync(CollectData));

// Total score endpoint with direct implementation
router.get("/total-score/:privyId", async (req, res) => {
    try {
        const { privyId } = req.params;
        
        if (!privyId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: privyId'
            });
        }
        
        console.log(`Fetching total score for privyId: ${privyId}`);
        
        // Find the score record
        const scoreRecord = await Score.findOne({ privyId });
        
        if (!scoreRecord) {
            console.log(`No score record found for privyId: ${privyId}`);
            
            // Check if user exists
            const userRecord = await User.findOne({ privyId });
            
            if (userRecord) {
                // Return user's score data
                return res.status(200).json({
                    success: true,
                    data: {
                        privyId: userRecord.privyId,
                        totalScore: userRecord.totalScore || 0,
                        twitterScore: userRecord.scoreDetails?.twitterScore || 0,
                        telegramScore: userRecord.scoreDetails?.veridaScore || 0,
                        badges: []
                    }
                });
            }
            
            // No user or score found
            return res.status(200).json({
                success: true,
                data: {
                    totalScore: 0,
                    badges: []
                }
            });
        }
        
        // Return score data
        return res.status(200).json({
            success: true,
            data: {
                totalScore: scoreRecord.totalScore || 0,
                twitterScore: scoreRecord.twitterScore || 0,
                telegramScore: scoreRecord.telegramScore || 0,
                wallets: scoreRecord.wallets || [],
                badges: scoreRecord.badges || []
            }
        });
    } catch (error) {
        console.error(`Error fetching total score: ${error.message}`);
        console.error(error.stack);
        return res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

module.exports = router;


