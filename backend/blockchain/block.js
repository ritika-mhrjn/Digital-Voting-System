// backend/blockchain/block.js
import crypto from 'crypto';

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index; // block position in the chain
    this.timestamp = timestamp; // when block created
    this.data = data; // vote data: voterId, candidateId
    this.previousHash = previousHash; // hash of previous block
    this.hash = this.calculateHash(); // current block hash
  }

  // Calculate block hash using SHA-256
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data))
      .digest('hex');
  }
}

export default Block;
