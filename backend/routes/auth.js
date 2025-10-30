import express from 'express';
import User from '../models/User.js';
import Voter from '../models/Voter.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register user (pending until committee verifies)
 * @body    { email, password, fullName, voterid|voterId, idNumber, dateOfBirth, phone, idType, province, district, ward }
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      voterid,
      voterId: voterIdAlt,
      idNumber,
      dateOfBirth,
      phone,
      idType,
      province,
      district,
      ward,
      // role from client is ignored to prevent privilege escalation
    } = req.body;

    // Basic required checks
    if (!email || !password || !fullName || !(voterid || voterIdAlt)) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('common.missing_fields') : 'Missing required fields',
      });
    }

    // Normalize & guard role
    const safeRole = 'voter';

    // Pull canonical voterId (support both keys)
    const voterId = String(voterid || voterIdAlt || '').trim();

    // 1) Check registry (authoritative list)
    const registry = await Voter.findOne({ voterId });
    if (!registry) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('voter.not_found') : 'VoterId not found in the official registry',
      });
    }

    // Optional: simple name match (case-insensitive)
    const sameName =
      (registry.fullName || '').trim().toLowerCase() === (fullName || '').trim().toLowerCase();
    if (!sameName) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('voter.name_mismatch') : 'Provided full name does not match the registry',
      });
    }

    if (registry.hasRegistered) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('voter.already_registered') : 'This VoterId has already been registered',
      });
    }

    // 2) Prevent duplicate user accounts
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
        message: req.t ? req.t('auth.user_exists') : 'User already exists with this email, voter ID, or ID number',
      });
    }

    // 3) Create user in PENDING state (not verified)
    const user = await User.create({
      email,
      password,
      fullName,
      voterId,          // canonical field (alias to voterid in your model)
      idNumber,
      role: safeRole,
      dateOfBirth,
      phone,
      idType,
      province,
      district,
      ward,
      isVerified: false // alias to `verified` in your schema
    });

    // 4) Mark registry as registered (but not verified yet)
    registry.hasRegistered = true;
    await registry.save();

    // No token yet (pending verification)
    return res.status(201).json({
      success: true,
      message: req.t ? req.t('auth.register_received') : 'Registration received. Await Electoral Committee verification.',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
        isVerified: user.isVerified, // false
        role: user.role,             // 'voter'
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: req.t ? req.t('common.server_error') : 'Server Error',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (only if verified)
 * @body    { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // password is select:false in model, so include it here
    const user = await User.findOne({ email: (email || '').toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('auth.invalid_credentials') : 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('auth.invalid_credentials') : 'Invalid email or password',
      });
    }

    // Block login until committee verifies
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: req.t ? req.t('auth.pending_verification') : 'Your account is pending verification by the Electoral Committee',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: req.t ? req.t('auth.login_success') : 'Login successful',
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
    console.error(err);
    return res.status(500).json({
      success: false,
      message: req.t ? req.t('common.server_error') : 'Server Error',
    });
  }
});

export default router;
