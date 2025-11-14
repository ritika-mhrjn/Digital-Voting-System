const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const { protect, authorize } = require('../middleware/authMiddleware.js');

//Verify candidate by electoral_committee/admin
router.patch('/verify-candidate/:id', protect, authorize('electoral_committee', 'admin'), async (req, res) => {
  try {
    const candidate = await User.findById(req.params.id);
    if (!candidate || candidate.role !== 'candidate') {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    if (candidate.isVerified) {
      return res.status(400).json({ success: false, message: 'Candidate already verified' });
    }

    candidate.isVerified = true;
    candidate.verifiedBy = req.user._id;
    candidate.verifiedAt = new Date();
    await candidate.save();

    res.json({
      success: true,
      message: 'Candidate verified successfully.',
      data: {
        id: candidate._id,
        email: candidate.email,
        voterId: candidate.voterId,
        isVerified: candidate.isVerified,
      },
    });
  } catch (err) {
    console.error('verify-candidate error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//Optional: list all pending candidates
router.get('/candidates/pending', protect, authorize('electoral_committee', 'admin'), async (req, res) => {
  try {
    const pending = await User.find({ role: 'candidate', isVerified: false })
      .select('_id fullName email voterId createdAt');
    res.json({ success: true, data: pending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Optional: list verified candidates
router.get('/candidates/verified', protect, authorize('electoral_committee', 'admin'), async (req, res) => {
  try {
    const verified = await User.find({ role: 'candidate', isVerified: true })
      .select('_id fullName email voterId verifiedAt');
    res.json({ success: true, data: verified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
