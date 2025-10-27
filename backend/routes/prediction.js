// routes/prediction.js
const express = require('express');
const router = express.Router();
const { predictWinner } = require('../controllers/predictionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin triggers AI prediction
router.get('/:electionId', protect, adminOnly, predictWinner);

module.exports = router;
