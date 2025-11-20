const express = require('express');
const { protect, committeeOrAdmin } = require('../middleware/authMiddleware.js');
const { 
  verifyVoter, 
  getAllVoters, 
  updateVoter, 
  deleteVoter 
} = require('../controllers/voterController.js');
const Voter = require('../models/Voter.js');

const router = express.Router();

// 1. Get all voters
router.get('/', protect, committeeOrAdmin, getAllVoters);

// 2. Verify voter (STATIC ROUTE → MUST COME BEFORE /:id)
router.patch('/verify/:voterId', protect, committeeOrAdmin, verifyVoter);

// 3. Update voter
router.put('/:id', protect, committeeOrAdmin, updateVoter);

// 4. Delete voter
router.delete('/:id', protect, committeeOrAdmin, deleteVoter);

// 5. Get single voter (KEPT LAST to avoid route collision)
router.get('/:id', protect, committeeOrAdmin, async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    res.json({ success: true, data: voter });

  } catch (err) {
    console.error("Get single voter error:", err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
