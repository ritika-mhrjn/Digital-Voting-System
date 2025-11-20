const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    password: { type: String, required: true, select: false },

    partyName: { type: String, required: true, trim: true },

    manifesto: { type: String, default: '' },

    age: { type: Number, required: true, min: 21 },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },

    position: {
      type: String,
      required: true,
    },

    photo: {
      type: String,
      default: '',
    },

    politicalSign: {
      type: String, // image URL for political symbol
      default: '',
    },

    totalVotes: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);
