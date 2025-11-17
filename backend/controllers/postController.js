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
    const posts = await Post.find().sort({ createdAt: -1 });
    return res.json(posts);
  } catch (err) {
    console.error("getPosts error:", err);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const post = await Post.create(req.body);
    return res.json(post);
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(400).json({ error: "Failed to create post" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.postId, req.body, {
      new: true,
    });

    return res.json(updated);
  } catch (err) {
    console.error("updatePost error:", err);
    return res.status(400).json({ error: "Failed to update post" });
  }
};
exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    return res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(400).json({ error: "Failed to delete post" });
  }
};
exports.addReaction = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { user_id, type } = req.body;

    if (!postId || !user_id || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Create reaction
    const reaction = await Reaction.create({
      user_id: asId(user_id),
      post_id: asId(postId),
      type,
      timestamp: new Date(),
    });

    // Update reactions count
    await Post.updateOne(
      { _id: asId(postId) },
      { $inc: { reactionsCount: 1 } }
    );

    // Fetch election ID from post
    const post = await Post.findById(asId(postId));
    const electionId = post?.election_id || post?.electionId || post?.election;

    // AI prediction update
    if (electionId && AI_PREDICTION_URL) {
      try {
        const url = `${AI_PREDICTION_URL.replace(/\/$/, "")}/predict?election_id=${encodeURIComponent(
          electionId
        )}`;
        const resp = await axios.get(url, { timeout: 10000 });

        const io = req.app.get("io");
        if (io) {
          io.to(electionId).emit("prediction:update", resp.data);
          io.emit("prediction:update", { electionId, data: resp.data });
        }
      } catch (err) {
        console.warn("AI refresh failed:", err.message);
      }
    }

    // Emit reaction event to UI
    const io = req.app.get("io");
    if (io) {
      io.emit("reaction:created", {
        postId,
        user_id,
        type,
      });
    }

    return res.json({ success: true, insertedId: reaction._id });
  } catch (err) {
    console.error("addReaction error:", err);
    return res
      .status(500)
      .json({ error: "Failed to add reaction", details: err.message });
  }
};
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { user_id, text } = req.body;

    if (!postId || !user_id || !text) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Create comment
    const comment = await Comment.create({
      user_id: asId(user_id),
      post_id: asId(postId),
      text,
      timestamp: new Date(),
    });

    // Fetch election ID from post
    const post = await Post.findById(asId(postId));
    const electionId = post?.election_id || post?.electionId || post?.election;

    // Trigger AI model update
    if (electionId && AI_PREDICTION_URL) {
      try {
        const url = `${AI_PREDICTION_URL.replace(/\/$/, "")}/predict?election_id=${encodeURIComponent(
          electionId
        )}`;
        const resp = await axios.get(url, { timeout: 10000 });

        const io = req.app.get("io");
        if (io) {
          io.to(electionId).emit("prediction:update", resp.data);
          io.emit("prediction:update", { electionId, data: resp.data });
        }
      } catch (err) {
        console.warn("AI refresh failed after comment:", err.message);
      }
    }

    // Emit comment event
    const io = req.app.get("io");
    if (io) {
      io.emit("comment:created", {
        postId,
        user_id,
        text,
      });
    }

    return res.json({ success: true, insertedId: comment._id });
  } catch (err) {
    console.error("addComment error:", err);
    return res
      .status(500)
      .json({ error: "Failed to add comment", details: err.message });
  }
};
