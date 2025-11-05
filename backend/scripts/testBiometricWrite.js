const mongoose = require('mongoose');
const Biometric = require('../models/Biometric');
require('dotenv').config();

async function runTest() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/digital-voting';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const userId = new mongoose.Types.ObjectId();

    const doc = await Biometric.findOneAndUpdate(
      { userId },
      {
        $set: {
          faceEncoding: [1, 2, 3],
          faceEncodingEncrypted: 'abc123',
          faceTemplateId: 'TEMP001',
          faceRegistered: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Saved doc:', doc);
  } catch (err) {
    console.error('Error writing test biometric doc:', err);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
  }
}

// Run only when executed directly (so requiring this file for syntax checks is safe)
if (require.main === module) {
  runTest().then(() => process.exit(0));
}
