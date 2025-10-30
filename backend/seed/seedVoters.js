import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Voter from '../models/Voter.js';

dotenv.config();

// --- Simple name generators ---
const firstNames = [
  'Raman','Sita','Bikash','Aarati','Krishna','Anita','Bishal','Laxmi','Dipak','Sabina',
  'Prakash','Sunita','Raju','Nirmala','Kiran','Rita','Hari','Sarita','Sanjay','Manisha',
  'Gopal','Meena','Rajesh','Roshni','Ramesh','Asha','Rojina','Suresh','Kushal','Bhawana'
];

const lastNames = [
  'Maharjan','Shrestha','Lama','Thapa','Magar','Rai','Tamang','Gurung','Basnet','Karki',
  'KC','Pandey','Oli','Bhandari','Dahal','Poudel','Adhikari','Nepal','Malla','Shah'
];

function randomName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${l}`;
}

function randomDOB() {
  const year = Math.floor(Math.random() * (2003 - 1970 + 1)) + 1970;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomNatId() {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

// --- Generate 500 voters ---
const voters = Array.from({ length: 500 }, (_, i) => ({
  voterId: `NP-${String(i + 1).padStart(3, '0')}`,
  fullName: randomName(),
  dob: randomDOB(),
  nationalId: randomNatId(),
  hasRegistered: false
}));

async function seed() {
  try {
    // 1️⃣ connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // 2️⃣ clear existing registry (optional)
    await Voter.deleteMany({});
    console.log(' Cleared old voter records');

    // 3️⃣ insert new list
    const result = await Voter.insertMany(voters);
    console.log(`Inserted ${result.length} voters`);

    // 4️⃣ disconnect
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding voters:', err);
    process.exit(1);
  }
}

seed();
