const express = require("express");
const {
  addCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController.js");
const { protect, committeeOrAdmin } = require("../middleware/authMiddleware.js");

const router = express.Router();

/**
 * CANDIDATE ROUTES
 * Base path: /api/candidates
 */

// Add new candidate (only admin or committee)
router.post("/", protect, committeeOrAdmin, addCandidate);

//  Get all candidates (public access)
router.get("/", getAllCandidates);

// Get candidate by ID (public access)
router.get("/:id", getCandidateById);

//  Update candidate (admin or committee only)
router.put("/:id", protect, committeeOrAdmin, updateCandidate);

//  Delete candidate (admin or committee only)
router.delete("/:id", protect, committeeOrAdmin, deleteCandidate);

module.exports = router;
