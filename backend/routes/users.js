const express = require("express");
const multer = require("multer");
const {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
} = require("../controllers/userController");

const router = express.Router();

// Multer storage (temporary local uploads)
const upload = multer({ dest: "uploads/" });

router.get("/:userId", getUserProfile);                 // GET /users/:userId
router.put("/:userId", updateUserProfile);              // PUT /users/:userId
// router.post(
//   "/:userId/profile-pic",
//   upload.single("profilePic"),
//   uploadProfileImage
// );                                                      // POST /users/:userId/profile-pic

router.post('/profilePicture/:userId',uploadProfileImage)

module.exports = router;
