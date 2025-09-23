const express = require('express');
const router = express.Router();
const { addBaby, getMyBabies } = require('./babyController');
const authMiddleware = require('./authMiddleware');

// @route   POST api/babies
// @desc    Add a new baby
// @access  Private
router.post('/', authMiddleware, addBaby);

// @route   GET api/babies
// @desc    Get all babies for a user
// @access  Private
router.get('/', authMiddleware, getMyBabies);

module.exports = router;