import User from '../models/User.js';
import Voter from '../models/voter.js';
import jwt from 'jsonwebtoken';

// Register User
export const registerUser = async (req, res) => {
  try {
    const { email, voterId, password, fullName } = req.body;

    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Voter ID — not found in electoral database',
      });
    }

    if (voter.hasRegistered) {
      return res.status(400).json({
        success: false,
        message: 'This Voter ID is already registered.',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { voterId }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists!',
      });
    }

    const user = new User({ email, voterId, password, fullName });
    await user.save();

    voter.hasRegistered = true;
    await voter.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password, voterId } = req.body;

    const user = await User.findOne({ email, voterId }).select('+password');
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};
