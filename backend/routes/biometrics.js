const express = require('express');
const biometricController = require('../controllers/biometricController.js');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');   // <-- FIX
const { protect: auth } = require('../middleware/authMiddleware.js');

const router = express.Router();

/* ----------------------------------------------------------
   FACE QUALITY CHECK RATE LIMITER (development friendly)
----------------------------------------------------------- */
const faceQualityLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 2000,                  // Allow plenty for live polling
  message: {
    error: 'Too many face quality check requests, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,

  // FIXED KEY GENERATOR (no more IPv6 crash)
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req);                    // Express safe helper
    const userAgent = req.get('user-agent') || 'ua';   // Add UA for uniqueness
    return `${ip}-${userAgent}`;
  },

  // Skip rate limit for localhost + OPTIONS
  skip: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || '';
    const isLocalhost =
      ip === '::1' ||
      ip === '127.0.0.1' ||
      ip.includes('127.0.0.1') ||
      ip.includes('localhost') ||
      ip.includes('::ffff:127.0.0.1');

    const isOptions = req.method === 'OPTIONS';

    if (isLocalhost) console.debug(`[Quality-Check] Skip for localhost: ${ip}`);
    if (isOptions) console.debug(`[Quality-Check] Skip for OPTIONS preflight`);

    return isLocalhost || isOptions;
  }
});

/* ----------------------------------------------------------
   BIOMETRIC ROUTES
----------------------------------------------------------- */

// Main registration + verification
router.post('/register', auth, biometricController.registerBiometrics);
router.post('/verify', biometricController.verifyBiometrics);
router.get('/status/:userId', auth, biometricController.getBiometricStatus);

// Face processing
router.post('/face/validate', biometricController.validateFace);
router.post('/face/quality-check', faceQualityLimiter, biometricController.strictQualityCheck);
router.post('/face/register', biometricController.registerFace);          // unauthenticated allowed
router.post('/face/register-batch', biometricController.registerFaceBatch);
router.post('/face/verify', biometricController.verifyFace);

// Check if face exists
router.get('/face/exists/:userId', async (req, res) => {
  try {
    const axios = require('axios');
    const BIOMETRIC_SERVICE_URL =
      process.env.BIOMETRIC_SERVICE_URL || 'http://localhost:8000';

    // Try microservice first
    try {
      const resp = await axios.get(
        `${BIOMETRIC_SERVICE_URL.replace(/\/$/, '')}/api/biometrics/face/exists/${encodeURIComponent(req.params.userId)}`,
        {
          timeout: 5000,
          validateStatus: (s) => s >= 200 && s < 500
        }
      );

      if (resp && resp.data !== undefined) {
        return res.json({
          exists: !!resp.data.exists,
          source: 'microservice'
        });
      }
    } catch (svcErr) {
      console.warn(
        'Biometric microservice unavailable, falling back.',
        svcErr.message
      );
    }

    // Fallback: search backend DB
    try {
      const Biometric = require('../models/Biometric');
      const biometric = await Biometric.findOne({ userId: req.params.userId });
      return res.json({
        exists: !!biometric,
        source: 'backend'
      });
    } catch (error) {
      return res.status(500).json({
        exists: false,
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      exists: false,
      error: error.message
    });
  }
});

/* ----------------------------------------------------------
   WEBAUTHN ROUTES
----------------------------------------------------------- */
router.post('/webauthn/register-begin', biometricController.webauthnRegisterBegin);
router.post('/webauthn/register-verify', biometricController.webauthnRegisterVerify);
router.post('/webauthn/login-begin', biometricController.webauthnLoginBegin);
router.post('/webauthn/login-verify', biometricController.webauthnLoginVerify);

/* ----------------------------------------------------------
   TEST ROUTE
----------------------------------------------------------- */
router.post('/test/face-recognition', biometricController.testFaceRecognition);

module.exports = router;
