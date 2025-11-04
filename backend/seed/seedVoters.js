const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Voter = require('../models/Voter.js');

dotenv.config();

// ---- Helper data ----
const firstNames = [
  'Raman', 'Sita', 'Bikash', 'Aarati', 'Krishna', 'Anita', 'Bishal', 'Laxmi',
  'Dipak', 'Sabina', 'Prakash', 'Sunita', 'Raju', 'Nirmala', 'Kiran', 'Rita',
  'Hari', 'Sarita', 'Sanjay', 'Manisha', 'Gopal', 'Meena', 'Rajesh', 'Roshni',
  'Ramesh', 'Asha', 'Rojina', 'Suresh', 'Kushal', 'Bhawana', 'Milan', 'Dinesh',
  'Asmita', 'Sandesh', 'Bipana', 'Rachana', 'Keshav', 'Samir', 'Nabin', 'Usha'
];

const lastNames = [
  'Maharjan', 'Shrestha', 'Lama', 'Thapa', 'Magar', 'Rai', 'Tamang', 'Gurung',
  'Basnet', 'Karki', 'KC', 'Pandey', 'Oli', 'Bhandari', 'Dahal', 'Poudel',
  'Adhikari', 'Nepal', 'Malla', 'Shah', 'Sharma', 'Paudel', 'Subedi', 'Regmi',
  'Rijal', 'Upadhyay', 'Bhattarai', 'Panta', 'Koirala', 'Aryal'
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomName = () => `${pick(firstNames)} ${pick(lastNames)}`;

const randomDOB = () => {
  const y = Math.floor(Math.random() * (2003 - 1970 + 1)) + 1970;
  const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const randomNatId = () => String(Math.floor(1000000 + Math.random() * 9000000));

// ---- Generate data ----
const TOTAL_VOTERS = 1000; // change this number anytime
const voters = Array.from({ length: TOTAL_VOTERS }, (_, i) => ({
  voterId: `NP-${String(i + 1).padStart(3, '0')}`,  // NP-001 .. NP-1000
  fullName: randomName(),
  dateOfBirth: randomDOB(),
  nationalId: randomNatId(),
  hasRegistered: false
}));

// ---- Seed function ----
async function seed() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);

    if (process.argv.includes('--reset')) {
      await Voter.deleteMany({});
      console.log('Cleared old voter records');
    }

    console.log(`Preparing to insert ${TOTAL_VOTERS} voters...`);

    // use unordered insert to skip any accidental duplicates
    const result = await Voter.insertMany(voters, { ordered: false });
    console.log(`Successfully inserted ${result.length} voter records.`);

    const count = await Voter.countDocuments();
    console.log(`Current total voters in DB: ${count}`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err.message);
    if (err.writeErrors) {
      console.error('Sample writeErrors:', err.writeErrors.slice(0, 3).map(e => e.errmsg));
    }
    process.exit(1);
  }
}

seed();
