// seed/seedCandidate.js
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate.js');

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB  = process.env.MONGODB_DB  || 'NayaMatDb';

// --- sample data ---
const names = [
  'Rabindra Shrestha',
  'Kamala Gurung',
  'Amardeep Lama',
  'Karisma Tamang',
  'Dipendra KC',
  'Aarati Rai'
];

const randomDOB = () => {
  const y = Math.floor(Math.random() * (1995 - 1970 + 1)) + 1970;
  const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const randomNatId = () => String(Math.floor(1000000 + Math.random() * 9000000));
const pick = (arr, i) => arr[i % arr.length];

const parties = ['Nepali Congress','CPN UML','Maoist Centre','RPP','Independent'];
const genders = ['male','female','other'];

const candidates = names.map((name, i) => ({
  candidateId: `CAND-${String(i + 1).padStart(3, '0')}`,
  fullName: name,
  // REQUIRED by your schema:
  age: 30 + (i % 15),                       // >= 18
  gender: pick(genders, i),                 // 'male' | 'female' | 'other'
  partyName: pick(parties, i),

  // optional/present in schema:
  manifesto: 'Transparency and local development.',
  position: 'Mayor',
  photo: '',
  voterId: `NP-${String(i + 5).padStart(3, '0')}`, // only if you’ll link to Voter registry

  // if your schema contains these (it does not require them, but okay to include):
  dateOfBirth: randomDOB(),                 // extra info (not in schema, safe if schema ignores)
  nationalId: randomNatId(),                // extra info (schema will ignore if not defined)
}));

(async () => {
  try {
    await mongoose.connect(URI, { dbName: DB });
    console.log('Connected to MongoDB → host:', mongoose.connection.host, 'db:', mongoose.connection.name);

    if (process.argv.includes('--reset')) {
      const del = await Candidate.deleteMany({});
      console.log(`↻ Cleared ${del.deletedCount} existing candidates`);
    }

    console.log('Seed set size:', candidates.length);
    console.log('First candidate preview:', candidates[0]);

    // Upsert so reruns don’t duplicate or error on unique candidateId
    const ops = candidates.map(c => ({
      updateOne: {
        filter: { candidateId: c.candidateId },
        update: {
          $setOnInsert: {
            candidateId: c.candidateId,
            fullName: c.fullName,
            age: c.age,
            gender: c.gender,
            partyName: c.partyName,
            manifesto: c.manifesto,
            position: c.position,
            photo: c.photo,
            voterId: c.voterId,
            totalVotes: 0,
            isVerified: false,
            verifiedBy: null,
            verifiedAt: null
          }
        },
        upsert: true
      }
    }));

    const result = await Candidate.bulkWrite(ops, { ordered: false });
    console.log('bulkWrite:', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount
    });

    const all = await Candidate.find({})
      .select('candidateId fullName partyName position age gender isVerified')
      .sort({ candidateId: 1 })
      .lean();
    console.log('Current candidates:', all);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
})();
