import express from 'express';
import User from '../models/User.js';
import Voter from '../models/voter.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register user (pending until committee verifies)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      voterId,
      idNumber,
      dateOfBirth,
      phone,
      idType,
      province,
      district,
      ward,
    } = req.body;

    if (!email || !password || !fullName || !voterId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const registry = await Voter.findOne({ voterId });
    if (!registry) {
      return res.status(400).json({
        success: false,
        message: 'VoterId not found in the official registry',
      });
    }

    const sameName =
      (registry.fullName || '').trim().toLowerCase() ===
      (fullName || '').trim().toLowerCase();
    if (!sameName) {
      return res.status(400).json({
        success: false,
        message: 'Provided full name does not match the registry',
      });
    }

    if (registry.hasRegistered) {
      return res.status(400).json({
        success: false,
        message: 'This VoterId has already been registered',
      });
    }

    const userExists = await User.findOne({
      $or: [
        { email: (email || '').toLowerCase().trim() },
        { voterId },
        { idNumber },
      ],
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message:
          'User already exists with this email, voter ID, or ID number',
      });
    }

    const user = await User.create({
      email,
      password,
      fullName,
      voterId,
      idNumber,
      dateOfBirth,
      phone,
      idType,
      province,
      district,
      ward,
      role: 'voter',
      isVerified: false,
    });

    registry.hasRegistered = true;
    await registry.save();

    return res.status(201).json({
      success: true,
      message:
        'Registration received. Await Electoral Committee verification.',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (only if verified)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: (email || '').toLowerCase().trim(),
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          'Your account is pending verification by the Electoral Committee',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
});

export default router;
