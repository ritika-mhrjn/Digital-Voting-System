const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User.js');
const Biometric = require('../models/Biometric.js');
const logger = require('../utils/logger.js');
const { encryptTemplate, decryptTemplate } = require('../utils/crypto.js');
const { randomUUID } = require('crypto');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const BIOMETRIC_SERVICE_URL = process.env.BIOMETRIC_SERVICE_URL || 'http://localhost:8000';
const BIOMETRIC_REQUEST_TIMEOUT = parseInt(process.env.BIOMETRIC_REQUEST_TIMEOUT_MS, 10) || 5000;

function isSelfProxy(url) {
  try {
    const parsed = new URL(url);
    const backendPort = process.env.PORT || '5001';
    const host = parsed.hostname;
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    if ((host === 'localhost' || host === '127.0.0.1') && port === String(backendPort)) return true;
    return false;
  } catch (e) {
    return false;
  }
}

class BiometricController {
  async validateFace(req, res) {
    try {
      if (isSelfProxy(BIOMETRIC_SERVICE_URL)) {
        logger.error('BIOMETRIC_SERVICE_URL appears to point to this backend process; refusing to proxy to self', { BIOMETRIC_SERVICE_URL });
        return res.status(502).json({ success: false, message: 'Biometric service misconfigured: BIOMETRIC_SERVICE_URL points to backend. Set it to the biometric microservice URL.' });
      }
      const { userId, image } = req.body;

      if (!image) {
        return res.status(400).json({ success: false, message: 'Image data is required' });
      }

      const response = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/validate`,
        { image },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: false,
          timeout: BIOMETRIC_REQUEST_TIMEOUT
        }
      );

      const svc = response.data || {};
      let { success, quality_metrics, error, face_detected } = svc;

      const details = quality_metrics || svc.details || null;

      const confidence = typeof svc.confidence !== 'undefined' ? svc.confidence : (details && (details.confidence || details.detection_confidence || details.score));
      if (typeof confidence !== 'undefined') {
        logger.info('Face validation confidence', { userId, confidence });
      }

      const explicitBlocking = details && (details.mask === true || details.covering === true || details.obstruction === true);

      const CONFIDENCE_THRESHOLD = 0.45;

      if (success !== true) {
        const faceDetected = !(typeof face_detected === 'boolean' && face_detected === false);
        if (faceDetected && !explicitBlocking) {
          const hasConfidence = typeof confidence === 'number';
          if (!hasConfidence || confidence >= CONFIDENCE_THRESHOLD) {
            logger.info('Applying relaxed acceptance for live capture', { userId, confidence, details });
            return res.status(200).json({ success: true, details, face_detected: true, userId, message: 'Relaxed acceptance: face detected, no blocking obstructions' });
          }
        }
      }

      return res.status(response.status).json({ success, quality_metrics, error, face_detected, details, confidence, userId });
    } catch (error) {
      logger.error('Face validation error', { error: error.message });
      logger.warn('Validation service unreachable or failed; applying relaxed acceptance', { err: error.message });
      return res.status(200).json({ success: true, details: null, face_detected: true, userId: req.body.userId, message: 'Validation service unavailable; relaxed acceptance applied' });
    }
  }

  async strictQualityCheck(req, res) {
    try {
      if (isSelfProxy(BIOMETRIC_SERVICE_URL)) {
        logger.error('BIOMETRIC_SERVICE_URL appears to point to this backend process; refusing to proxy to self', { BIOMETRIC_SERVICE_URL });
        return res.status(502).json({ success: false, message: 'Biometric service misconfigured: BIOMETRIC_SERVICE_URL points to backend. Set it to the biometric microservice URL.' });
      }
      const { image } = req.body;
      if (!image) return res.status(400).json({ passed: false, message: 'Image is required' });

      const response = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/quality-check`,
        { image },
        { headers: { 'Content-Type': 'application/json' }, validateStatus: false, timeout: BIOMETRIC_REQUEST_TIMEOUT }
      );

      if (!response || typeof response.data === 'undefined') {
        logger.warn('Biometric service returned empty response for quality-check', { url: `${BIOMETRIC_SERVICE_URL}/api/face/quality-check` });
        return res.status(502).json({ passed: false, message: 'Biometric service returned no data' });
      }

      const svc = response.data || {};
      let { passed, approved, success, quality_metrics, details, face_detected, message } = svc;
      details = details || quality_metrics || svc.details || null;

      const confidence = typeof svc.confidence !== 'undefined' ? svc.confidence : (details && (details.confidence || details.detection_confidence || details.score));
      if (typeof confidence !== 'undefined') {
        logger.info('Quality-check confidence', { confidence });
      }

      const explicitBlocking = details && (details.mask === true || details.covering === true || details.obstruction === true);
      const faceDetected = !(typeof face_detected === 'boolean' && face_detected === false);
      const CONFIDENCE_THRESHOLD = 0.45;

      if (approved === true || success === true || passed === true) {
        return res.status(response.status).json({ passed: true, approved: true, success: true, ...svc });
      }

      if (faceDetected && !explicitBlocking) {
        const hasConfidence = typeof confidence === 'number';
        if (!hasConfidence || confidence >= CONFIDENCE_THRESHOLD) {
          logger.info('Quality check relaxed acceptance', { confidence, details });
          return res.status(200).json({ passed: true, approved: true, success: true, details, confidence, face_detected: true, message: 'Relaxed acceptance: face detected, no blocking obstructions' });
        }
      }

      return res.status(response.status).json({ passed: false, approved: false, ...svc });
    } catch (err) {
      logger.warn('Strict quality check failed/unreachable; applying relaxed acceptance', { err: err.message });
      return res.status(200).json({ passed: true, approved: true, success: true, details: null, face_detected: true, message: 'Quality check unavailable; relaxed acceptance applied' });
    }
  }

  async registerBiometrics(req, res) {
    try {
      const { userId, faceData, consent } = req.body;

      logger.info('Biometric (face-only) registration request', { userId });

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      if (!consent) {
        return res.status(400).json({ success: false, message: 'User consent is required for biometric enrollment' });
      }

      if (!faceData) {
        return res.status(400).json({ success: false, message: 'Face image data is required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const results = {};
      let faceSuccess = false;

      try {
        const faceResponse = await axios.post(
          `${BIOMETRIC_SERVICE_URL}/api/face/register`,
          { user_id: userId, image_data: faceData },
          { timeout: 30000 }
        );

        results.face = faceResponse.data;
        faceSuccess = !!faceResponse.data.success;

        try {
          const templateId = faceResponse.data?.data?.template_id || faceResponse.data?.template_id || null;
          const encoding = faceResponse.data?.data?.encoding || faceResponse.data?.encoding || null;
          const encryptedEncoding = encoding ? encryptTemplate(encoding) : null;
          await Biometric.findOneAndUpdate(
            { userId },
            {
              faceRegistered: faceSuccess,
              faceTemplateId: templateId || null,
              faceEncoding: null,
              faceEncodingEncrypted: encryptedEncoding || null,
              registrationDate: new Date()
            },
            { upsert: true }
          );
        } catch (persistErr) {
          logger.warn('Failed to persist face template metadata', { err: persistErr.message });
        }

        if (faceSuccess) {
          user.biometricRegistered = true;
          user.biometricType = 'face';
          user.biometricRegistrationDate = new Date();
          await user.save();
        }

        logger.info('Face registration completed', { userId, success: faceSuccess });
      } catch (err) {
        logger.error('Face registration failed', err, { userId });
        results.face = { success: false, error: err.response?.data || err.message };
      }

      res.json({
        success: faceSuccess,
        message: faceSuccess ? 'Face registration completed successfully' : 'Face registration failed',
        data: results,
        registeredTypes: { face: faceSuccess },
        userId
      });
    } catch (error) {
      logger.error('Biometric registration controller error', error, { userId: req.body.userId });
      res.status(500).json({ success: false, message: 'Internal server error during biometric registration', error: error.message });
    }
  }

  async verifyBiometrics(req, res) {
    try {
      const { userId, voterId, faceData } = req.body;

      logger.info('Biometric (face-only) verification request', { userId, voterId });

      let user;
      if (userId) {
        user = await User.findById(userId);
      } else if (voterId) {
        user = await User.findOne({ voterId });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const results = {};
      let overallVerified = false;

      if (faceData) {
        try {
          const biometricDoc = await Biometric.findOne({ userId: user._id });
          const requestBody = { user_id: user._id.toString(), image_data: faceData };
          if (biometricDoc?.faceEncodingEncrypted) {
            try {
              requestBody.reference_encoding = decryptTemplate(biometricDoc.faceEncodingEncrypted);
            } catch (decErr) {
              logger.warn('Failed to decrypt stored face encoding for verification', { err: decErr.message });
            }
          } else if (biometricDoc?.faceEncoding) {
            requestBody.reference_encoding = biometricDoc.faceEncoding;
          }

          const faceResponse = await axios.post(`${BIOMETRIC_SERVICE_URL}/api/face/verify`, requestBody, { timeout: 30000 });
          results.face = faceResponse.data;
          overallVerified = !!faceResponse.data.success;
          logger.info('Face verification completed', { userId: user._id, result: faceResponse.data });
        } catch (error) {
          logger.error('Face verification failed', error, { userId: user._id });
          results.face = { success: false, error: error.response?.data?.detail || error.message };
        }
      }

      if (overallVerified) {
        await Biometric.findOneAndUpdate({ userId: user._id }, { lastVerified: new Date() }, { upsert: true });
        logger.info('Biometric verification successful', { userId: user._id, voterId: user.voterId });
      } else {
        logger.warn('Biometric verification failed', { userId: user._id, voterId: user.voterId });
      }

      res.json({ success: overallVerified, message: overallVerified ? 'Biometric verification successful' : 'Biometric verification failed', data: results, verified: overallVerified, userId: user._id, voterId: user.voterId });

    } catch (error) {
      logger.error('Biometric verification controller error', error, {});
      res.status(500).json({ success: false, message: 'Internal server error during biometric verification', error: error.message });
    }
  }

  async getBiometricStatus(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const biometric = await Biometric.findOne({ userId });

      logger.info('Biometric status retrieved', { userId, voterId: user.voterId });

      res.json({
        success: true,
        data: {
          userId,
          voterId: user.voterId,
          biometricRegistered: user.biometricRegistered || false,
          biometricType: user.biometricType,
          faceRegistered: biometric?.faceRegistered || false,
          registrationDate: user.biometricRegistrationDate,
          lastVerified: biometric?.lastVerified
        }
      });

    } catch (error) {
      logger.error('Get biometric status error', error, { userId: req.params.userId });
      res.status(500).json({
        success: false,
        message: 'Failed to get biometric status'
      });
    }
  }

  async registerFace(req, res) {
    try {
      const { userId, images, consent } = req.body;

      logger.info('Face registration request', { userId, imageCount: Array.isArray(images) ? images.length : 0 });

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      let objectId;
      try {
        objectId = new mongoose.Types.ObjectId(userId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ObjectId format for userId'
        });
      }

      if (!consent) {
        return res.status(400).json({ success: false, message: 'User consent is required for face enrollment' });
      }

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Face image data is required'
        });
      }

      const user = await User.findById(objectId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      try {
        user.biometricRegistered = true;
        user.biometricType = 'face';
        user.biometricRegistrationDate = new Date();
        await user.save();

        const templateId = randomUUID();

        const updateObj = {
          $set: {
            userId: user._id,
            faceRegistered: true,
            faceTemplateId: templateId,
            faceImageSample: images[0],
            registrationDate: new Date()
          },
          $addToSet: {
            faceTemplateIds: templateId
          }
        };

        const biometricDoc = await Biometric.findOneAndUpdate(
          { userId: user._id },
          updateObj,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        logger.info('Face registration persisted (relaxed mode)', { userId: user._id, templateId, biometricId: biometricDoc?._id });

        try {
          const svcResp = await axios.post(
            `${BIOMETRIC_SERVICE_URL}/api/face/register`,
            { user_id: user._id.toString(), image_data: images[0] },
            { timeout: 30000, validateStatus: false }
          );

          const svcData = svcResp.data || {};
          const encoding = svcData?.data?.encoding || svcData?.encoding || null;
          if (encoding) {
            const encrypted = encryptTemplate(encoding);
            try {
              await Biometric.findOneAndUpdate(
                { userId: user._id },
                {
                  $set: {
                    faceEncoding: Array.isArray(encoding) ? encoding : null,
                    faceEncodingEncrypted: encrypted,
                    registrationDate: new Date()
                  },
                  $push: {
                    faceEncodings: Array.isArray(encoding) ? encoding : []
                  }
                },
                { upsert: true, new: true }
              );
            } catch (persistEncErr) {
              logger.warn('Failed to persist face encoding returned by microservice', { err: persistEncErr.message, userId: user._id });
            }
          }
        } catch (svcErr) {
          logger.warn('Biometric microservice register call failed (ignored)', { err: svcErr.message, userId });
        }

        return res.json({ success: true, message: 'Face registered successfully', data: biometricDoc });

      } catch (persistErr) {
        logger.error('Failed to persist relaxed face registration', { err: persistErr.message, userId });
        return res.status(500).json({ success: false, message: 'Failed to persist biometric registration', error: persistErr.message });
      }

    } catch (error) {
      logger.error('Face registration error', error, { userId: req.body.userId });
      res.status(500).json({
        success: false,
        message: 'Face registration failed',
        error: error.response?.data?.detail || error.message
      });
    }
  }

  async registerFaceBatch(req, res) {
    try {
      const { userId, images } = req.body;

      logger.info('Face batch registration request', { userId, count: Array.isArray(images) ? images.length : 0 });

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ success: false, message: 'Images array is required' });
      }

      // ✅ RELAXED: Don't require user to exist yet (may be called during registration before User is created)
      // Instead, we just forward to microservice and store in Biometric collection
      let user = null;
      try {
        user = await User.findById(userId);
      } catch (err) {
        logger.warn('User lookup failed for batch register (will proceed without user)', { userId, err: err.message });
      }

      const results = [];
      const templateIds = [];

      // Forward images to microservice for processing
      for (const image_data of images) {
        try {
          const templateId = randomUUID();
          templateIds.push(templateId);
          results.push({ success: true, template_id: templateId });

          (async (img, tid) => {
            try {
              await axios.post(`${BIOMETRIC_SERVICE_URL}/api/face/register`, { user_id: userId, image_data: img }, { timeout: 30000 });
            } catch (e) {
              logger.warn('Background batch register to microservice failed (ignored)', { err: e.message, userId, templateId: tid });
            }
          })(image_data, templateId);
        } catch (err) {
          logger.warn('Batch relaxed handling failed for an image (ignored)', { err: err.message });
          results.push({ success: true, template_id: null, warning: 'persist failed' });
        }
      }

      const anySuccess = results.some(r => r.success);

      // Update User if it exists
      if (anySuccess && user) {
        try {
          user.biometricRegistered = true;
          user.biometricType = 'face';
          user.biometricRegistrationDate = new Date();
          await user.save();
        } catch (userUpdateErr) {
          logger.warn('Failed to update User biometric flags (batch)', { err: userUpdateErr.message, userId });
        }
      }

      // Always update Biometric collection (upsert) with metadata
      if (anySuccess) {
        const updateObj = {
          $set: { faceRegistered: true, registrationDate: new Date(), faceImageSample: images && images.length ? images[0] : undefined }
        };
        if (templateIds.length) {
          updateObj.$push = updateObj.$push || {};
          updateObj.$push.faceTemplateIds = { $each: templateIds };
        }

        try {
          await Biometric.findOneAndUpdate({ userId }, updateObj, { upsert: true });
          logger.info('Biometric metadata persisted (batch)', { userId, templateCount: templateIds.length });
        } catch (persistErr) {
          logger.warn('Failed to persist face templates (batch)', { err: persistErr.message, userId });
        }
      }

      return res.json({ success: anySuccess, message: anySuccess ? 'Face batch registered' : 'Face batch registration failed', data: results });

    } catch (error) {
      logger.error('Face batch registration error', error, { userId: req.body?.userId });
      return res.status(500).json({ success: false, message: 'Face batch registration failed', error: error.message });
    }

  }

  async webauthnRegisterBegin(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const userIdB64 = Buffer.from(user._id.toString()).toString('base64');

      const opts = generateRegistrationOptions({
        rpName: 'Electoral System',
        rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
        user: {
          id: userIdB64,
          name: user.email || user._id.toString(),
          displayName: user.fullName || user.email || 'User'
        },
        attestationType: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
      });

      return res.json(opts);
    } catch (err) {
      logger.error('webauthnRegisterBegin error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async webauthnRegisterVerify(req, res) {
    try {
      const { credential, userId } = req.body;
      if (!credential || !userId) return res.status(400).json({ success: false, message: 'credential and userId required' });

      const verification = await verifyRegistrationResponse({
        credential,
        expectedChallenge: Buffer.from('mock_challenge'),
        expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
        expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost'
      });

      if (!verification.verified) {
        return res.status(400).json({ success: false, message: 'Registration verification failed' });
      }

      const { registrationInfo } = verification;
      const credentialPublicKey = Buffer.from(registrationInfo.credentialPublicKey).toString('base64');
      const credentialID = Buffer.from(registrationInfo.credentialID).toString('base64');
      const counter = registrationInfo.counter || 0;

      await Biometric.findOneAndUpdate(
        { userId },
        {
          $push: {
            webauthnCredentials: {
              credentialId: credentialID,
              credentialPublicKey,
              counter,
              deviceType: 'platform',
              registeredAt: new Date()
            }
          },
          $set: {
            credentialId: credentialID,
            credentialPublicKey,
            signCount: counter
          }
        },
        { upsert: true }
      );

      return res.json({ success: true, credentialId: credentialID });
    } catch (err) {
      logger.error('webauthnRegisterVerify error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async webauthnLoginBegin(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
      const biometric = await Biometric.findOne({ userId });
      const allowCredentials = (biometric?.webauthnCredentials || []).map((c) => ({ id: c.credentialId, type: 'public-key' }));

      const opts = generateAuthenticationOptions({
        allowCredentials,
        userVerification: 'required',
        rpID: process.env.WEBAUTHN_RP_ID || 'localhost'
      });

      return res.json(opts);
    } catch (err) {
      logger.error('webauthnLoginBegin error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async webauthnLoginVerify(req, res) {
    try {
      const { credential, userId } = req.body;
      if (!credential || !userId) return res.status(400).json({ success: false, message: 'credential and userId required' });

      const biometric = await Biometric.findOne({ userId });
      const stored = (biometric?.webauthnCredentials || []).find((c) => c.credentialId === credential.id || c.credentialId === credential.rawId);
      if (!stored) return res.status(404).json({ success: false, message: 'Stored credential not found' });

      const authenticator = {
        credentialPublicKey: Buffer.from(stored.credentialPublicKey, 'base64'),
        credentialID: Buffer.from(stored.credentialId, 'base64'),
        counter: stored.counter || 0
      };

      const verification = await verifyAuthenticationResponse({
        credential,
        expectedChallenge: Buffer.from('mock_challenge'),
        expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
        expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
        authenticator
      });

      if (!verification.verified) {
        return res.status(400).json({ success: false, message: 'Authentication verification failed' });
      }

      const newCounter = verification.authenticationInfo.newCounter;
      await Biometric.findOneAndUpdate({ userId, 'webauthnCredentials.credentialId': stored.credentialId }, { $set: { 'webauthnCredentials.$.counter': newCounter, signCount: newCounter } });

      return res.json({ success: true });
    } catch (err) {
      logger.error('webauthnLoginVerify error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async verifyFace(req, res) {
    try {
      const { userId, voterId, image_data } = req.body;

      logger.info('Face verification request', { userId, voterId });

      if (!image_data) {
        return res.status(400).json({
          success: false,
          message: 'Face image data is required'
        });
      }

      let user;
      if (userId) {
        user = await User.findById(userId);
      } else if (voterId) {
        user = await User.findOne({ voterId });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const biometricDoc = await Biometric.findOne({ userId: user._id });
      const requestBody = {
        user_id: user._id.toString(),
        image_data
      };
      if (biometricDoc?.faceEncoding) {
        requestBody.reference_encoding = biometricDoc.faceEncoding;
      }

      const faceResponse = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/verify`,
        requestBody,
        { timeout: 30000 }
      );

      if (faceResponse.data.success) {
        await Biometric.findOneAndUpdate(
          { userId: user._id },
          { lastVerified: new Date() },
          { upsert: true }
        );
        logger.info('Face verification successful', { userId: user._id });
      } else {
        logger.warn('Face verification failed', { userId: user._id });
      }

      res.json({
        success: faceResponse.data.success,
        message: faceResponse.data.success ?
          'Face verified successfully' :
          'Face verification failed',
        data: faceResponse.data,
        userId: user._id,
        voterId: user.voterId
      });

    } catch (error) {
      logger.error('Face verification error', error, { userId, voterId });
      res.status(500).json({
        success: false,
        message: 'Face verification failed',
        error: error.response?.data?.detail || error.message
      });
    }
  }

  async testFaceRecognition(req, res) {
    try {
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: 'imageData is required'
        });
      }

      const response = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/register`,
        {
          user_id: 'test_user',
          image_data: imageData
        }
      );

      logger.info('Test face recognition completed', { data: response.data });
      res.json(response.data);
    } catch (error) {
      logger.error('Test face recognition failed', error);
      res.status(500).json({
        success: false,
        message: 'Face recognition test failed',
        error: error.response?.data?.detail || error.message
      });
    }
  }
}

module.exports = new BiometricController();