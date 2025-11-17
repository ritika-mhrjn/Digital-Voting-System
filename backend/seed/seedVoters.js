

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Voter = require('../models/Voter.js');

dotenv.config();


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

// DOB between 1970–2003
const randomDOB = () => {
  const y = Math.floor(Math.random() * (2003 - 1970 + 1)) + 1970;
  const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const randomNatId = () => String(1000000 + Math.floor(Math.random() * 9000000));


function generateValidVoterId(sequence) {
  while (true) {
    let raw = String(sequence).padStart(10, '0'); // 10 digits

    // Validation rules
    if (raw.startsWith('0')) { sequence++; continue; }
    if (raw.includes('000')) { sequence++; continue; }
    if (raw.includes('00')) { sequence++; continue; }

    // Apply format
    const voterId =
      `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 9)}-${raw.slice(9)}`;

    return { voterId, nextSequence: sequence + 1 };
  }
}


const TOTAL_VOTERS = 1000;
let currentSeq = 1;

const voters = Array.from({ length: TOTAL_VOTERS }, () => {
  const { voterId, nextSequence } = generateValidVoterId(currentSeq);
  currentSeq = nextSequence;

  return {
    voterId,
    fullName: randomName(),
    dateOfBirth: randomDOB(),
    nationalId: randomNatId(),
    hasRegistered: false
  };
});


async function seed() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`\n✓ Connected to MongoDB @ ${conn.connection.host}/${conn.connection.name}`);

    // Reset option
    if (process.argv.includes('--reset')) {
      await Voter.deleteMany({});
      console.log('✓ Cleared old voter records');
    }

    console.log(`\n Inserting ${TOTAL_VOTERS} voters...`);

    const result = await Voter.insertMany(voters, { ordered: false });
    console.log(` Inserted ${result.length} voters successfully`);

    const count = await Voter.countDocuments();
    console.log(` Total voters now in DB: ${count}`);

    await mongoose.disconnect();
    console.log(' MongoDB disconnected cleanly\n');
    process.exit(0);

  } catch (err) {
    console.error('\n Error during seeding:', err.message);

    if (err.writeErrors) {
      console.log('\nSample write errors:');
      err.writeErrors.slice(0, 3).forEach(e => console.log(' -', e.errmsg));
    }

    process.exit(1);
  }
}

seed();
