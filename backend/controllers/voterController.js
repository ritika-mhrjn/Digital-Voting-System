import User from '../models/User.js';
import Voter from '../models/Voter.js';

/**
 * GET /api/voter
 * List voters in the official registry (committee/admin)
 * Optional query: q (search by voterId/fullName), registered (true/false)
 */
export const getAllVoters = async (req, res) => {
  try {
    const { q, registered } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { voterId: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') },
      ];
    }
    if (registered === 'true') filter.hasRegistered = true;
    if (registered === 'false') filter.hasRegistered = false;

    const voters = await Voter.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: voters });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * PATCH /api/voter/verify/:voterId
 * Mark a registered user as verified (committee/admin)
 */
export const verifyVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const user = await User.findOne({ voterId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found for this voterId' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Ensure voter exists in registry
    const registry = await Voter.findOne({ voterId });
    if (!registry) {
      return res.status(404).json({ success: false, message: 'Registry entry not found' });
    }

    user.isVerified = true;
    await user.save();

    return res.json({
      success: true,
      message: 'Voter verified successfully',
      data: { id: user._id, voterId: user.voterId, isVerified: user.isVerified },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const importVotersCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });

    // Expect headers: voterId,fullName   (extras optional: dob,nationalId)
    const rows = parse(req.file.buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows found in CSV' });
    }

    const ops = rows
      .filter(r => r.voterId && r.fullName)
      .map(r => ({
        updateOne: {
          filter: { voterId: String(r.voterId).trim() },
          update: {
            $setOnInsert: {
              voterId: String(r.voterId).trim(),
              fullName: String(r.fullName).trim(),
              dob: r.dob ? String(r.dob).trim() : undefined,
              nationalId: r.nationalId ? String(r.nationalId).trim() : undefined,
              hasRegistered: false,
            }
          },
          upsert: true,
        }
      }));

    if (ops.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid voter rows' });
    }

    const result = await Voter.bulkWrite(ops);
    return res.status(201).json({ success: true, message: 'Voters imported', result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

