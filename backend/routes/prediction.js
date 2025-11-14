// backend/routes/prediction.js
const express = require("express");
const { getPublicPrediction } = require("../controllers/predictionController.js");
const { protect, committeeOrAdmin } = require("../middleware/authMiddleware.js"); 

const router = express.Router();

// Public endpoint: GET /api/prediction/public/:electionId
router.get("/public/:electionId", getPublicPrediction);

// Admin/Committee endpoint: GET /api/prediction/:electionId
// (secured; useful if you later want richer/private outputs)
router.get("/:electionId", protect, committeeOrAdmin, getPublicPrediction);

module.exports = router;
