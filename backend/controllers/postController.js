const mongoose = require("mongoose");
const axios = require("axios");

const Post = require("../models/Post");
const Reaction = require("../models/Reaction");
const Comment = require("../models/Comment");

const AI_PREDICTION_URL = process.env.AI_PREDICTION_URL;

const asId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "fullName profilePic role")
      .populate("candidate", "fullName photo party")
      .populate("election", "title startDate endDate")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: posts });
  } catch (err) {
    console.error("getPosts error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch posts" });
  }
};


exports.createPost = async (req, res) => {
  try {
    // Automatically assign logged-in user as author
    const body = {
      ...req.body,
      author: req.user?._id || req.body.author,
    };

    const post = await Post.create(body);

    // Return populated post
    const populated = await Post.findById(post._id)
      .populate("author", "fullName profilePic role")
      .populate("candidate", "fullName photo party")
      .populate("election", "title");

    return res.json({ success: true, data: populated });
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(400).json({ success: false, error: "Failed to create post" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.postId, req.body, {
      new: true,
    })
      .populate("author", "fullName profilePic role")
      .populate("candidate", "fullName photo party")
      .populate("election", "title startDate endDate");

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updatePost error:", err);
    return res.status(400).json({ success: false, error: "Failed to update post" });
  }
};
exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    return res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(400).json({ success: false, error: "Failed to delete post" });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { user_id, type } = req.body;

    if (!postId || !user_id || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Insert reaction
    const reaction = await Reaction.create({
      user_id: asId(user_id),
      post_id: asId(postId),
      type,
      timestamp: new Date(),
    });

    // Increment reactions count
    await Post.updateOne({ _id: asId(postId) }, { $inc: { reactionsCount: 1 } });

    // Fetch post to identify election
    const post = await Post.findById(asId(postId));
    const electionId = post?.election;

    // Trigger AI prediction
    if (electionId && AI_PREDICTION_URL) {
      try {
        const url = `${AI_PREDICTION_URL.replace(/\/$/, "")}/predict?election_id=${encodeURIComponent(
          electionId
        )}`;
        const resp = await axios.get(url, { timeout: 10000 });

        const io = req.app.get("io");
        if (io) {
          io.to(electionId.toString()).emit("prediction:update", resp.data);
        }
      } catch (err) {
        console.warn("AI refresh failed:", err.message);
      }
    }

    // Socket emit for UI
    const io = req.app.get("io");
    if (io) {
      io.emit("reaction:created", {
        postId,
        user_id,
        type,
      });
    }

    return res.json({ success: true, reactionId: reaction._id });
  } catch (err) {
    console.error("addReaction error:", err);
    return res.status(500).json({ error: "Failed to add reaction" });
  }
};
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { user_id, text } = req.body;

    if (!postId || !user_id || !text) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const comment = await Comment.create({
      user_id: asId(user_id),
      post_id: asId(postId),
      text,
      timestamp: new Date(),
    });

    // Fetch post for election
    const post = await Post.findById(asId(postId));
    const electionId = post?.election;

    // Update AI model
    if (electionId && AI_PREDICTION_URL) {
      try {
        const url = `${AI_PREDICTION_URL.replace(/\/$/, "")}/predict?election_id=${encodeURIComponent(
          electionId
        )}`;
        const resp = await axios.get(url, { timeout: 10000 });

        const io = req.app.get("io");
        if (io) {
          io.to(electionId.toString()).emit("prediction:update", resp.data);
        }
      } catch (err) {
        console.warn("AI refresh failed after comment:", err.message);
      }
    }

    // Comment event to frontend
    const io = req.app.get("io");
    if (io) {
      io.emit("comment:created", {
        postId,
        user_id,
        text,
      });
    }

    return res.json({ success: true, commentId: comment._id });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ error: "Failed to add comment" });
  }
};
