const express = require('express');
const router = express.Router();
const path = require('path');
const authMiddleware = require('./authMiddleware');

// @route   GET /mypage
// @desc    Render mypage
router.get('/mypage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mypage.html'));
});

module.exports = router;