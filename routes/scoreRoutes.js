const express = require("express");
const { CollectData, getTotalScore } = require('../controllers/NewScoreController.js');
const { validate, schemas } = require('../utils/validation');
const { catchAsync } = require('../utils/errorHandler');

const router = express.Router();

// Redirect old GET endpoint to use the new controller
router.get("/get-score/:privyId/:username/:address", catchAsync(CollectData));

// Main endpoint for score calculation with validation
router.post("/get-score", validate(schemas.scoreRequest), catchAsync(CollectData));

// Total score endpoint
router.get("/total-score/:privyId", catchAsync(getTotalScore));

module.exports = router;


