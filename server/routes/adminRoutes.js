const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Attempt = require('../models/Attempt');
const Test = require('../models/Test');
const User = require('../models/User');

// @desc    Get Dashboard Stats
// @route   GET /api/admin/stats
// @access  Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalTests = await Test.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' }); // Approximate
        const attempts = await Attempt.find({ completed: true });

        const totalAttempts = attempts.length;
        const avgScore = totalAttempts > 0
            ? attempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts
            : 0;

        // Recent attempts
        const recentAttempts = await Attempt.find({ completed: true })
            .sort({ endTime: -1 })
            .limit(5)
            .populate('student', 'name email')
            .populate('test', 'title');

        res.json({
            totalTests,
            totalStudents, // ideally count unique students who attempted
            totalAttempts,
            avgScore: avgScore.toFixed(2),
            recentAttempts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

module.exports = router;
