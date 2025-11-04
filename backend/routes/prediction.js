const express = require('express');
const { predictWinner } = require('../controllers/predictionController.js');
const { protect, adminOnly } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Admin triggers AI prediction
router.get("/:electionId", protect, adminOnly, predictWinner);

module.exports= router;
