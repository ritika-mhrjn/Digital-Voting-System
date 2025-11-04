const mongoose = require('mongoose');
const { protect, adminOnly } = require('../middleware/authMiddleware.js');
const { createElection, getElections } = require('../controllers/electionController.js');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const electionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    candidates: [candidateSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Election = mongoose.model("Election", electionSchema);
module.exports= Election;
