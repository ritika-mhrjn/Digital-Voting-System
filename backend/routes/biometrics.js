const express = require('express');
const biometricController = require('../controllers/biometricController.js');
const rateLimit = require('express-rate-limit');
const { protect: auth } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Relaxed rate limiter for quality checks during development
const faceQualityLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Increased from 10 to 100 for development
  message: {
    error: 'Too many face quality check requests, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting for localhost during development
    return req.ip === '::1' || req.ip === '127.0.0.1';
  }
});

router.post('/register', auth, biometricController.registerBiometrics);
router.post('/verify', biometricController.verifyBiometrics);
router.get('/status/:userId', auth, biometricController.getBiometricStatus);

router.post('/face/validate', biometricController.validateFace);
router.post('/face/quality-check', faceQualityLimiter, biometricController.strictQualityCheck);
router.post('/face/register', auth, biometricController.registerFace);
router.post('/face/register-batch', auth, biometricController.registerFaceBatch);
router.post('/face/verify', auth, biometricController.verifyFace);
router.get('/face/exists/:userId', auth, async (req, res) => {
  try {
    const Biometric = require('../models/Biometric');
    const biometric = await Biometric.findOne({ userId: req.params.userId });
    res.json({ exists: !!biometric });
  } catch (error) {
    res.status(500).json({ exists: false, error: error.message });
  }
});

router.post('/webauthn/register-begin', biometricController.webauthnRegisterBegin);
router.post('/webauthn/register-verify', biometricController.webauthnRegisterVerify);
router.post('/webauthn/login-begin', biometricController.webauthnLoginBegin);
router.post('/webauthn/login-verify', biometricController.webauthnLoginVerify);

router.post('/test/face-recognition', biometricController.testFaceRecognition);

module.exports = router;