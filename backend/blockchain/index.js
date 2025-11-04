// backend/blockchain/index.js
const Blockchain = require('./blockchain.js');

export const blockchain = new Blockchain();

// Optional: print blockchain status
console.log('🧩 Blockchain initialized with genesis block');
