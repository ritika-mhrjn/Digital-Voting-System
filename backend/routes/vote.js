const express = require('express');
const { castVote, getLeaderboard } = require('../controllers/voteController.js');
const { protect, requireVerified } = require('../middleware/authMiddleware.js');
const router = express.Router();

// Cast a vote — only logged-in users
router.post("/cast", protect, castVote);

// Only verified voter can access this
router.post('/', protect, requireVerified, castVote);

// Get election leaderboard — public
router.get("/leaderboard/:electionId", getLeaderboard);

module.exports= router;
