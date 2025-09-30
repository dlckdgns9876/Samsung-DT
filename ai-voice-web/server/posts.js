const express = require('express');
const router = express.Router();
const { getPosts, getPostById, createPost, updatePost, deletePost } = require('./postController');
const authMiddleware = require('./authMiddleware');

// @route   GET api/posts
// @desc    Get all posts
// @access  Public
router.get('/', getPosts);

// @route   GET api/posts/:id
// @desc    Get a single post and increment view count
// @access  Public
router.get('/:id', getPostById);

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', authMiddleware, createPost);

// @route   PUT api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', authMiddleware, updatePost);

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', authMiddleware, deletePost);

module.exports = router;
