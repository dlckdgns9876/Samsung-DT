const express = require('express');
const router = express.Router();
const { updateNickname, updatePassword } = require('./userController');
const authMiddleware = require('./authMiddleware');

// @route   PUT api/users/nickname
// @desc    Update user nickname
router.put('/nickname', authMiddleware, updateNickname);

// @route   PUT api/users/password
// @desc    Update user password
router.put('/password', authMiddleware, updatePassword);

module.exports = router;