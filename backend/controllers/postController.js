const mongoose = require('mongoose');
const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');

// Add a reaction to a post
exports.addReaction = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { user_id, type } = req.body;
    if (!postId || !user_id || !type) return res.status(400).json({ error: 'missing fields' });

    // create reaction doc
    const doc = await mongoose.connection.collection('reactions').insertOne({
      user_id: mongoose.Types.ObjectId.isValid(user_id) ? new mongoose.Types.ObjectId(user_id) : user_id,
      post_id: mongoose.Types.ObjectId.isValid(postId) ? new mongoose.Types.ObjectId(postId) : postId,
      type,
      timestamp: new Date()
    });

    // increment post reactionsCount
    await mongoose.connection.collection('posts').updateOne({ _id: mongoose.Types.ObjectId(postId) }, { $inc: { reactionsCount: 1 } });

    // Try to trigger immediate prediction recompute by calling AI service and emitting result
    try {
      // find post to resolve election id
      const post = await mongoose.connection.collection('posts').findOne({ _id: mongoose.Types.ObjectId(postId) });
      const electionId = post ? (post.election_id || post.electionId || post.election) : null;

      // call AI prediction endpoint to refresh model output for this election
      if (electionId) {
        try {
          const url = `${AI_PREDICTION_URL.replace(/\/$/, '')}/predict?election_id=${encodeURIComponent(electionId)}`;
          const resp = await axios.get(url, { timeout: 10000 });
          const data = resp.data;
          const io = req.app.get('io');
          if (io) {
            io.to(electionId).emit('prediction:update', data);
            io.emit('prediction:update', { electionId, data });
          }
        } catch (err) {
          console.warn('AI refresh failed after reaction:', err.message || err);
        }
      }

      // emit lightweight event for UI
      try {
        const io = req.app.get('io');
        if (io) io.emit('reaction:created', { postId, type, user_id });
      } catch (e) {}

      return res.json({ success: true, insertedId: doc.insertedId });
    } catch (err) {
      console.error('addReaction error', err.message || err);
      return res.status(500).json({ error: 'failed to add reaction', details: err.message || err });
    }
  } catch (err) {
    console.error('addReaction error', err.message || err);
    return res.status(500).json({ error: 'failed to add reaction', details: err.message || err });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { user_id, text } = req.body;
    if (!postId || !user_id || !text) return res.status(400).json({ error: 'missing fields' });

    const doc = await mongoose.connection.collection('comments').insertOne({
      user_id: mongoose.Types.ObjectId.isValid(user_id) ? new mongoose.Types.ObjectId(user_id) : user_id,
      post_id: mongoose.Types.ObjectId.isValid(postId) ? new mongoose.Types.ObjectId(postId) : postId,
      text,
      timestamp: new Date()
    });

    // Trigger immediate prediction recompute similar to reactions
    try {
      const post = await mongoose.connection.collection('posts').findOne({ _id: mongoose.Types.ObjectId(postId) });
      const electionId = post ? (post.election_id || post.electionId || post.election) : null;
      if (electionId) {
        try {
          const url = `${AI_PREDICTION_URL.replace(/\/$/, '')}/predict?election_id=${encodeURIComponent(electionId)}`;
          const resp = await axios.get(url, { timeout: 10000 });
          const data = resp.data;
          const io = req.app.get('io');
          if (io) {
            io.to(electionId).emit('prediction:update', data);
            io.emit('prediction:update', { electionId, data });
          }
        } catch (err) {
          console.warn('AI refresh failed after comment:', err.message || err);
        }
      }

      try {
        const io = req.app.get('io');
        if (io) io.emit('comment:created', { postId, text, user_id });
      } catch (e) {}

      return res.json({ success: true, insertedId: doc.insertedId });
    } catch (err) {
      console.error('addComment error', err.message || err);
      return res.status(500).json({ error: 'failed to add comment', details: err.message || err });
    }
  } catch (err) {
    console.error('addComment error', err.message || err);
    return res.status(500).json({ error: 'failed to add comment', details: err.message || err });
  }
};
