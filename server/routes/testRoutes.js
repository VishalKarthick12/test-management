const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadQuestions, createQuestions, createTest, getTest, getTests, getTestByLink, getTestQuestions, getAllQuestions, toggleTest, deleteTest, deleteQuestion, deleteAllQuestions } = require('../controllers/testController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Admin routes (protected)
router.post('/upload-questions', protect, admin, upload.single('file'), uploadQuestions);
router.post('/create-questions', protect, admin, createQuestions);
router.post('/', protect, admin, createTest);
router.get('/', protect, admin, getTests);
router.get('/questions/all', protect, admin, getAllQuestions);
router.delete('/questions/all', protect, admin, deleteAllQuestions);
router.delete('/questions/:id', protect, admin, deleteQuestion);
router.put('/:id/toggle', protect, admin, toggleTest);
router.delete('/:id', protect, admin, deleteTest);
router.get('/:id', protect, admin, getTest);

// Public routes (for students)
router.get('/link/:uniqueLink', getTestByLink);
router.get('/:id/questions', getTestQuestions);

module.exports = router;
