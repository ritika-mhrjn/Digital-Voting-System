const express = require('express');
const { castVote, getLeaderboard } = require('../controllers/voteController.js');
const { protect, requireVerified } = require('../middleware/authMiddleware.js');
const Vote = require('../models/Vote.js');
const router = express.Router();


router.get("/", protect, async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate("voter", "fullname email")
      .populate("candidate", "name party")
      .populate("election", "title status")
      .lean();

    res.status(200).json(votes);
  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({ message: "Failed to fetch votes" });
  }
});

// Cast a vote — only logged-in users
router.post("/cast", protect, castVote);

// Only verified voter can access this
router.post('/', protect, requireVerified, castVote);

// Get election leaderboard — public
router.get("/leaderboard/:electionId", getLeaderboard);

module.exports= router;
