const Candidate = require('../models/Candidate.js');
const Election = require('../models/Election.js');

/**
 * GET /api/predictions/winner/:electionId
 * Predicts the winner based on a simulated engagement scoring model.
 */
const predictWinner = async (req, res) => {
  try {
    const { electionId } = req.params;
    
    // NOTE: For this to work, your Election model schema must have a 
    // 'candidates' field that references the Candidate model.
    const election = await Election.findById(electionId).populate('candidates');

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // Ensure candidates array exists before mapping
    if (!election.candidates || election.candidates.length === 0) {
        return res.status(404).json({ message: 'No candidates found for this election' });
    }

    // Simulate AI scoring based on engagements
    const predictions = election.candidates.map(candidate => {
      // NOTE: This score calculation relies on candidate documents having 'likes', 'comments', and 'shares' fields.
      const score = 
        (candidate.likes || 0) * 0.6 + 
        (candidate.comments || 0) * 1 + // Assuming a missing value defaults to 0
        (candidate.shares || 0) * 2;   // Assuming a missing value defaults to 0
        
      return { name: candidate.name, score: parseFloat(score.toFixed(2)) };
    });

    const sorted = predictions.sort((a, b) => b.score - a.score);
    const predictedWinner = sorted[0];

    res.status(200).json({
      success: true,
      message: 'Predicted winner based on simulated engagement analysis',
      predictedWinner,
      allCandidates: sorted
    });
  } catch (error) {
    console.error('Prediction error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// --- CommonJS Export ---

module.exports = {
  predictWinner,
};