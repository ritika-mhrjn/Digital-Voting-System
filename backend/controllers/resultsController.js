const mongoose = require('mongoose');
const Vote = require('../models/Vote.js');
const Candidate = require('../models/Candidate.js'); // case-sensitive
const Election = require('../models/Election.js');
const { io } = require('../server.js');

// --- Utility Functions ---

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Determine if an election is completed based on various schema fields. */
function isElectionCompleted(election) {
  if (!election) return false;
  if (typeof election.status === 'string') return election.status === 'completed';
  if (typeof election.isCompleted === 'boolean') return election.isCompleted === true;
  const now = new Date();
  if (election.endDate && new Date(election.endDate) < now) return true;
  if (typeof election.isActive === 'boolean') return election.isActive === false;
  return false;
}

/** Builds the vote count leaderboard using MongoDB aggregation. */
async function buildLeaderboard(electionId) {
  const eid = new mongoose.Types.ObjectId(electionId);

  const rows = await Candidate.aggregate([
    { $match: { election: eid } },
    {
      $lookup: {
        from: 'votes',
        let: { cid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$candidate', '$$cid'] }, { $eq: ['$election', eid] }] }
            }
          },
          { $count: 'count' },
        ],
        as: 'voteStats',
      },
    },
    { $addFields: { totalVotes: { $ifNull: [{ $arrayElemAt: ['$voteStats.count', 0] }, 0] } } },
    { $project: { _id: 0, candidateId: '$_id', name: 1, party: 1, totalVotes: 1 } },
    { $sort: { totalVotes: -1 } },
  ]);

  const totalVotes = rows.reduce((s, r) => s + (r.totalVotes || 0), 0);
  const leaderboard = rows.map(r => ({ ...r, percent: totalVotes ? (r.totalVotes / totalVotes) * 100 : 0 }));

  return { totalVotes, leaderboard };
}

// --- Controller Functions ---

/** GET /api/results/leaderboard/:electionId */
const getLeaderboard = async (req, res) => {
  try {
    const { electionId } = req.params;
    if (!isValidId(electionId)) return res.status(400).json({ success: false, message: 'Invalid electionId' });

    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });

    const { totalVotes, leaderboard } = await buildLeaderboard(electionId);
    return res.status(200).json({
      success: true,
      data: { electionId, status: election.status, totalVotes, leaderboard },
    });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/** GET /api/results/final/:electionId */
const getResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    if (!isValidId(electionId)) return res.status(400).json({ success: false, message: 'Invalid electionId' });

    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });
    if (!isElectionCompleted(election)) {
      return res.status(400).json({ success: false, message: 'Election not completed yet' });
    }

    const { totalVotes, leaderboard } = await buildLeaderboard(electionId);
    return res.status(200).json({
      success: true,
      data: {
        electionId,
        status: election.status ?? 'completed',
        publishedAt: election.publishedAt,
        totalVotes,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('getResults error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/** POST /api/results/publish  body:{ electionId }  (committee/admin) */
const publishResults = async (req, res) => {
  try {
    const { electionId } = req.body;
    if (!isValidId(electionId)) return res.status(400).json({ success: false, message: 'Invalid electionId' });

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });

    // mark completed & stamp published time (supports either schema style)
    election.status = 'completed';
    election.isActive = false;
    election.publishedAt = new Date();
    if (!election.endDate) election.endDate = new Date();
    await election.save();

    const { totalVotes, leaderboard } = await buildLeaderboard(electionId);

    // broadcast final board via Socket.IO
    const room = String(electionId);
    io.to(room).emit('leaderboard:update', { electionId, totalVotes, leaderboard, status: 'completed' });
    io.to(room).emit('results:published', { electionId, totalVotes, leaderboard });

    return res.status(200).json({
      success: true,
      message: 'Results published',
      data: { electionId, totalVotes, leaderboard },
    });
  } catch (error) {
    console.error('publishResults error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- CommonJS Export ---

module.exports = { getLeaderboard, getResults, publishResults };