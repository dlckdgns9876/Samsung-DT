const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { addBaby, getMyBabies, updateBaby } = require('./babyController');
const authMiddleware = require('./authMiddleware');

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 최상위 uploads 폴더로 경로 변경
  },
  filename: function (req, file, cb) {
    // 파일명 중복을 피하기 위해 타임스탬프와 원본 파일명을 조합
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// @route   POST api/babies
// @desc    Add a new baby
// @access  Private
router.post('/', authMiddleware, upload.single('profile_image'), addBaby);

// @route   GET api/babies
// @desc    Get all babies for a user
// @access  Private
router.get('/', authMiddleware, getMyBabies);

// @route   PUT api/babies/:id
// @desc    Update a baby's information
// @access  Private
router.put('/:id', authMiddleware, updateBaby);

module.exports = router;
