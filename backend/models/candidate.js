
import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
    },
    manifesto: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      required: true,
      min: 18,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    position: {
      type: String,
      required: true, // e.g., "President", "Vice-President", etc.
    },
    photo: {
      type: String, // store image URL (e.g. Cloudinary or local uploads)
      default: '',
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // who added the candidate (admin or electoral committee)
    },
  },
  { timestamps: true }
);

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
