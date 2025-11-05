Add explicit defaults & loosen schema for debugging

(helps confirm writes even if microservice or encryption is off)

Add to your schema definition:

const BiometricSchema = new mongoose.Schema({
  faceEncoding: { type: Array, default: null },
  faceEncodingEncrypted: { type: String, default: null },
  faceTemplateId: { type: String, default: null },
  faceTemplateIds: { type: [String], default: [] },
  faceImageSample: { type: String, default: null },
  faceRegistered: { type: Boolean, default: false },
  registrationDate: { type: Date, default: Date.now },
  lastVerified: { type: Date, default: null },
}, { strict: false }); // temporary for debugging


Then restart the backend and do one registration — check the Mongo document; you should now see those fields even if the microservice didn’t send data.

🔹 Option 2 — Run a direct controller-level test

Create a small script (in backend/scripts/testBiometricWrite.js):

const mongoose = require('mongoose');
const Biometric = require('../models/Biometric');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await Biometric.findOneAndUpdate(
    { userId: 'test-user' },
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
  process.exit();
})();


Run with:

node backend/scripts/testBiometricWrite.js


If the resulting doc in MongoDB contains those fields, schema and DB path are confirmed working — the issue lies before this (microservice or controller flow).

🔹 Option 3 — Test microservice connectivity

Run:

curl -X POST http://localhost:8000/api/face/register \
  -H "Content-Type: application/json" \
  -d '{"user_id":"debug","image_data":"data:image/png;base64,<BASE64_SAMPLE>"}'


If you get JSON with keys like "encoding" and "template_id", the service is healthy.
If not, backend will never get encoding → DB stays empty.