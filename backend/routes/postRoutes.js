const express = require('express');
const postController = require('../controllers/postController');
const router = express.Router();

// POST /api/posts/:postId/reactions
router.post('/:postId/reactions', postController.addReaction);
// POST /api/posts/:postId/comments
router.post('/:postId/comments', postController.addComment);

module.exports = router;
