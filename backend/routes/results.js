const express = require('express');
const { protect, committeeOrAdmin } = require('../middleware/authMiddleware.js');
const { getLeaderboard, getResults, publishResults } = require('../controllers/resultsController.js');

const router = express.Router();

// live leaderboard (any logged-in user)
router.get('/leaderboard/:electionId', protect, getLeaderboard);

// final results (completed elections)
router.get('/final/:electionId', protect, getResults);

// publish & lock results (committee/admin)
router.post('/publish', protect, committeeOrAdmin, publishResults);

module.exports= router;
