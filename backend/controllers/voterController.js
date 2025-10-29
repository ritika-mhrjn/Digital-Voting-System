import Voter from "../models/voter.js";

// Admin adds a voter
export const addVoter = async (req, res) => {
  try {
    const { voterId, fullName } = req.body;

    // Check if voter ID already exists
    const existing = await Voter.findOne({ voterId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Voter ID already exists" });
    }

    const voter = new Voter({ voterId, fullName });
    await voter.save();

    res.status(201).json({ success: true, message: "Voter added successfully", voter });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
