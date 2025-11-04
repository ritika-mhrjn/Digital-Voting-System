// import mongoose from "mongoose";
const mongoose=require('mongoose');

const voterSchema = new mongoose.Schema(
  {
    voterId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    hasRegistered: { type: Boolean, default: false }, // flips once user registers
    // optional but useful for committee matching:
    dateOfBirth: { type: String },         // e.g., "2001-05-21"
    nationalId: { type: String },  // govt ID if you have it
  },
  { timestamps: true }
);

const Voter = mongoose.models.Voter || mongoose.model('Voter', voterSchema);
module.exports= Voter;
