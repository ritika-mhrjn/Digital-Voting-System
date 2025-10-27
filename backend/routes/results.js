// routes/results.js
const express = require('express');
const router = express.Router();
const { getResults, getLeaderboard } = require('../controllers/resultsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get real-time leaderboard
router.get('/leaderboard/:electionId', protect, getLeaderboard);

// Get final results (admin only)
router.get('/final/:electionId', protect, adminOnly, getResults);

module.exports = router;
