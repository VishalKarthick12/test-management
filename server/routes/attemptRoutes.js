const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { startAttempt, saveProgress, submitAttempt, getAttempt, getAttemptsForTest } = require('../controllers/attemptController');

// Public routes (students — no auth)
router.post('/start', startAttempt);
router.put('/:id/save', saveProgress);
router.post('/:id/submit', submitAttempt);
router.get('/:id', getAttempt);

// Admin routes (protected)
router.get('/test/:testId', protect, admin, getAttemptsForTest);

module.exports = router;
