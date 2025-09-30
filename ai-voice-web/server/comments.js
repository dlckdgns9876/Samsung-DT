const express = require('express');
const router = express.Router();
const { getComments, createComment, updateComment, deleteComment } = require('./commentController');
const authMiddleware = require('./authMiddleware');

// @route   GET api/comments/:postId
// @desc    Get all comments for a post
// @access  Public
router.get('/:postId', getComments);

// @route   POST api/comments
// @desc    Create a comment
// @access  Private
router.post('/', authMiddleware, createComment);

// @route   PUT api/comments/:id
// @desc    Update a comment
// @access  Private
router.put('/:id', authMiddleware, updateComment);

// @route   DELETE api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;
