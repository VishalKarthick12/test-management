const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { startAttempt, saveProgress, submitAttempt, getAttempt } = require('../controllers/attemptController');

router.post('/start', protect, startAttempt);
router.put('/:id/save', protect, saveProgress);
router.post('/:id/submit', protect, submitAttempt);
router.get('/:id', protect, getAttempt);

module.exports = router;
