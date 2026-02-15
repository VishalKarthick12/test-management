const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadQuestions, createQuestions, createTest, getTest, getTests } = require('../controllers/testController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload-questions', protect, admin, upload.single('file'), uploadQuestions);
router.post('/create-questions', protect, admin, createQuestions);
router.post('/', protect, admin, createTest);
router.get('/', protect, admin, getTests);
router.get('/:id', protect, getTest);

module.exports = router;
