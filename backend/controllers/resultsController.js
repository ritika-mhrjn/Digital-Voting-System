import Vote from '../models/Vote.js';
import Candidate from '../models/candidate.js';
import Election from '../models/Election.js';

// 🟢 Get real-time leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { electionId } = req.params;

    const leaderboard = await Vote.aggregate([
      { $match: { election: electionId } },
      { $group: { _id: "$candidate", totalVotes: { $sum: 1 } } },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidate"
        }
      },
      { $unwind: "$candidate" },
      {
        $project: {
          _id: 0,
          candidateId: "$candidate._id",
          name: "$candidate.name",
          party: "$candidate.party",
          totalVotes: 1
        }
      },
      { $sort: { totalVotes: -1 } }
    ]);

    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🏆 Get final results
export const getResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);

    if (!election || !election.isCompleted) {
      return res.status(400).json({ message: "Election not completed yet" });
    }

    const results = await Vote.aggregate([
      { $match: { election: electionId } },
      { $group: { _id: "$candidate", totalVotes: { $sum: 1 } } },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidate"
        }
      },
      { $unwind: "$candidate" },
      {
        $project: {
          _id: 0,
          candidateId: "$candidate._id",
          name: "$candidate.name",
          totalVotes: 1
        }
      },
      { $sort: { totalVotes: -1 } }
    ]);

    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
