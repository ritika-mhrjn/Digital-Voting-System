const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// GET user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// UPDATE user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true }
    ).select("-password");
    if(updatedUser){
      console.log('bhayo')
      return res.json({data:updatedUser,success:true});
    }
    else{
      console.log('Bhako chaina')
    }
  } catch (error) {
    return res.status(400).json({ error: "Failed to update user profile" });
  }
};

// UPLOAD profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const {userId} =req.params;
    const image = req.body.image;
    console.log(userId)
    if (!image) {
      return res.status(400).json({ error: "No image provided",success:false });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: image },
      {new: true}
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" ,success:false});
    }

    return res.json({data:updatedUser, success:true});
  } catch (error) {
    return res.status(400).json({ error: "Failed to upload image", success:false });
  }
};
