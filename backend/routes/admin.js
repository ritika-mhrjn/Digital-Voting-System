const express = require("express");
const { getAdminStats, getAdminWinners } = require("../controllers/adminController.js");
// If you later want auth:
// const { protect, committeeOrAdmin } = require("../middleware/authMiddleware.js");

const router = express.Router();

/**
 * ADMIN ROUTES (public to match endpoints.js usage)
 * Base path: /api/admin
 */

// Dashboard stats
router.get("/stats", getAdminStats); 
// If you want auth later: router.get("/stats", protect, committeeOrAdmin, getAdminStats);

// Winning candidates (optionally pass ?electionId=...)
router.get("/winners", getAdminWinners); 
// If you want auth later: router.get("/winners", protect, committeeOrAdmin, getAdminWinners);

module.exports = router;
