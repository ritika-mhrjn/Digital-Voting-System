import mongoose from "mongoose";

const voterSchema = new mongoose.Schema({
  voterId: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  hasRegistered: {
    type: Boolean,
    default: false, // changes to true once user registers
  },
});

const Voter = mongoose.model("Voter", voterSchema);
export default Voter;
