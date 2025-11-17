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

    return res.json(updatedUser);
  } catch (error) {
    return res.status(400).json({ error: "Failed to update user profile" });
  }
};

// UPLOAD profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No image uploaded" });

    const imagePath = "/uploads/" + req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { profilePic: imagePath },
      { new: true }
    );

    return res.json(updatedUser);
  } catch (error) {
    return res.status(400).json({ error: "Failed to upload image" });
  }
};
