const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const { protect, admin } = require('../middleware/authMiddleware');
const Attempt = require('../models/Attempt');
const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Get Dashboard Stats
// @route   GET /api/admin/stats
// @access  Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalTests = await Test.countDocuments({ createdBy: req.user._id });
        const tests = await Test.find({ createdBy: req.user._id });
        const testIds = tests.map(t => t._id);

        const completedAttempts = await Attempt.find({
            test: { $in: testIds },
            completed: true
        });

        const totalAttempts = completedAttempts.length;
        const uniqueStudents = [...new Set(completedAttempts.map(a => a.studentEmail))].length;

        const avgScore = totalAttempts > 0
            ? (completedAttempts.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions * 100), 0) / totalAttempts).toFixed(1)
            : 0;

        const totalQuestions = await Question.countDocuments({ createdBy: req.user._id });

        // Recent attempts
        const recentAttempts = await Attempt.find({
            test: { $in: testIds },
            completed: true
        })
            .sort({ endTime: -1 })
            .limit(10)
            .populate('test', 'title');

        res.json({
            totalTests,
            uniqueStudents,
            totalAttempts,
            avgScore,
            totalQuestions,
            recentAttempts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// @desc    Get detailed results for a specific test
// @route   GET /api/admin/tests/:testId/results
// @access  Admin
router.get('/tests/:testId/results', protect, admin, async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId)
            .populate('questions');

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const attempts = await Attempt.find({
            test: req.params.testId,
            completed: true
        }).sort({ score: -1, timeTaken: 1 });

        res.json({
            test: {
                _id: test._id,
                title: test.title,
                duration: test.duration,
                totalQuestions: test.totalQuestions,
                questions: test.questions,
                showResults: test.showResults,
                uniqueLink: test.uniqueLink
            },
            attempts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching results' });
    }
});

// @desc    Export test results to Excel
// @route   GET /api/admin/tests/:testId/export
// @access  Admin
router.get('/tests/:testId/export', protect, admin, async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId).populate('questions');
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const attempts = await Attempt.find({
            test: req.params.testId,
            completed: true
        }).sort({ score: -1, timeTaken: 1 });

        // Build summary sheet
        const summaryData = attempts.map((a, idx) => ({
            'Rank': idx + 1,
            'Student Name': a.studentName,
            'Email': a.studentEmail,
            'Score': a.score,
            'Total Questions': a.totalQuestions,
            'Percentage': Math.round((a.score / a.totalQuestions) * 100) + '%',
            'Time Taken (sec)': a.timeTaken || 0,
            'Tab Switches': a.tabSwitchCount || 0,
            'Submitted At': a.endTime ? new Date(a.endTime).toLocaleString() : '—'
        }));

        // Build per-question sheet
        const questionMap = {};
        test.questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        const detailData = [];
        attempts.forEach(a => {
            a.answers.forEach((ans, i) => {
                const q = questionMap[ans.questionId?.toString()];
                detailData.push({
                    'Student Name': a.studentName,
                    'Email': a.studentEmail,
                    'Q#': i + 1,
                    'Question': q ? q.text : 'Unknown',
                    'Student Answer': ans.selectedOption || '(skipped)',
                    'Correct Answer': q ? q.correctAnswer : '—',
                    'Result': ans.isCorrect ? 'Correct' : 'Wrong',
                    'Time Spent (sec)': ans.timeSpent || 0
                });
            });
        });

        const wb = xlsx.utils.book_new();
        const ws1 = xlsx.utils.json_to_sheet(summaryData);
        const ws2 = xlsx.utils.json_to_sheet(detailData);
        xlsx.utils.book_append_sheet(wb, ws1, 'Summary');
        xlsx.utils.book_append_sheet(wb, ws2, 'Per-Question Detail');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${test.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.xlsx"`);
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error exporting results' });
    }
});

// @desc    Download sample Excel template for question upload
// @route   GET /api/admin/sample-template
// @access  Admin
router.get('/sample-template', protect, admin, async (req, res) => {
    try {
        const sampleData = [
            {
                question: 'What is the capital of France?',
                type: 'MCQ',
                options: 'Paris | London | Berlin | Madrid',
                rect_answ: 'Paris',
                difficulty: 'easy',
                category: 'Geography'
            },
            {
                question: 'Linux is an open-source operating system.',
                type: 'True/False',
                options: 'True | False',
                rect_answ: 'True',
                difficulty: 'easy',
                category: 'Linux'
            },
            {
                question: 'Which command lists files in Linux?',
                type: 'MCQ',
                options: 'ls | cd | rm | mv',
                rect_answ: 'ls',
                difficulty: 'medium',
                category: 'Linux'
            },
            {
                question: 'What does DNS stand for?',
                type: 'MCQ',
                options: 'Domain Name System | Data Network Service | Digital Name Server | Domain Network System',
                rect_answ: 'Domain Name System',
                difficulty: 'medium',
                category: 'Networking'
            },
            {
                question: 'The chmod 777 command gives full permissions to everyone.',
                type: 'True/False',
                options: 'True | False',
                rect_answ: 'True',
                difficulty: 'hard',
                category: 'Linux'
            }
        ];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(sampleData);

        // Set column widths
        ws['!cols'] = [
            { wch: 50 }, // question
            { wch: 12 }, // type
            { wch: 60 }, // options
            { wch: 25 }, // rect_answ
            { wch: 12 }, // difficulty
            { wch: 15 }  // category
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Questions');
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="question_template.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating template' });
    }
});

module.exports = router;
