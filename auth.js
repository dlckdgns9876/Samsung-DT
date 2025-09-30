const express = require('express');
const router = express.Router();
const { register, login, kakaoCallback } = require('./authController');

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Auth user & get token
router.post('/login', login);

// @route   GET api/auth/kakao/callback
// @desc    Kakao social login
router.get('/kakao/callback', kakaoCallback);

module.exports = router;