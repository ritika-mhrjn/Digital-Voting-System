const mongoose = require('mongoose');
const { io } = require('../server.js');
const Vote = require('../models/Vote.js');
const Election = require('../models/Election.js');
const Candidate = require('../models/Candidate.js');

// --- Utility Functions ---

/**
 * Build a rich tally with zero-vote candidates included.
 * @param {string} electionId - The ID of the election.
 * @returns {Promise<Object>} The election tally, including totalVotes and leaderboard.
 */
async function computeTally(electionId) {
  // Use Promise.all to fetch votes, candidates, and election details concurrently
  const [agg, candidates, election] = await Promise.all([
    Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidate', votes: { $sum: 1 } } },
    ]),
    Candidate.find({ election: electionId }).select('_id name party').lean(),
    Election.findById(electionId).lean(),
  ]);

  const totalVotes = agg.reduce((s, r) => s + r.votes, 0);
  // Map aggregated votes to a lookup table keyed by candidate ID
  const byId = Object.fromEntries(agg.map(a => [String(a._id), a.votes]));

  // Build the final leaderboard structure, adding zero votes where necessary
  const leaderboard = candidates
    .map(c => {
      const v = byId[String(c._id)] || 0;
      return {
        candidateId: c._id,
        name: c.name,
        party: c.party,
        votes: v,
        percent: totalVotes ? (v / totalVotes) * 100 : 0,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  return {
    electionId,
    status: election?.status,
    totalVotes,
    leaderboard,
  };
}

// --- Controller Functions ---

/**
 * POST /api/votes/cast
 * Cast a vote (only for verified users; enforce one vote per election)
 */
const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const userId = req.user._id;
    // Handle potential schema variations for voter ID field
    const voterIdStr = req.user.voterId || req.user.voterid; 

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(electionId) ||
      !mongoose.Types.ObjectId.isValid(candidateId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid election or candidate ID' });
    }

    // Ensure election exists and is open
    const election = await Election.findById(electionId);
    if (!election)
      return res.status(404).json({ success: false, message: 'Election not found' });

    const now = new Date();
    if (election.startsAt && now < new Date(election.startsAt)) {
      return res.status(400).json({ success: false, message: 'Voting has not started' });
    }
    if (election.endsAt && now > new Date(election.endsAt)) {
      return res.status(400).json({ success: false, message: 'Voting period has ended' });
    }
    // Check status field if available
    if (election.status && !['ongoing', 'open'].includes(election.status)) {
      return res.status(400).json({ success: false, message: 'Election is not open for voting' });
    }

    // Optional eligibility filter based on voterId array
    if (Array.isArray(election.eligibleVoterIds) && election.eligibleVoterIds.length > 0) {
      if (!voterIdStr || !election.eligibleVoterIds.includes(voterIdStr)) {
        return res
          .status(403)
          .json({ success: false, message: 'You are not eligible to vote in this election' });
      }
    }

    // Validate candidate belongs to this election
    const candidate = await Candidate.findOne({ _id: candidateId, election: electionId });
    if (!candidate) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid candidate for this election' });
    }

    // Prevent duplicate vote (user can only vote once per election)
    const existingVote = await Vote.findOne({ voter: userId, election: electionId });
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already voted' });
    }

    // Store the vote
    await Vote.create({
      voter: userId,
      candidate: candidateId,
      election: electionId,
      castAt: new Date(),
    });

    // Recompute tally & broadcast live updates via Socket.IO
    const tally = await computeTally(electionId);
    const room = String(electionId);
    io.to(room).emit('leaderboard:update', tally);      // namespaced event
    io.to(room).emit('leaderboardUpdate', tally);       // backward compatibility

    return res
      .status(201)
      .json({ success: true, message: 'Vote cast successfully', data: tally });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * GET /api/votes/leaderboard/:electionId
 * Public leaderboard for an election (logged-in users)
 */
const getLeaderboard = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ success: false, message: 'Invalid election ID' });
    }

    const tally = await computeTally(electionId);
    return res.status(200).json({ success: true, data: tally });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- CommonJS Export ---

module.exports = {
  castVote,
  getLeaderboard,
};