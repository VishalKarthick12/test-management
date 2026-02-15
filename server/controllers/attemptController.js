const Attempt = require('../models/Attempt');
const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Start a test attempt (student — no auth)
// @route   POST /api/attempts/start
// @access  Public
const startAttempt = async (req, res) => {
    try {
        const { testId, studentName, studentEmail, accessCode } = req.body;

        if (!studentName || !studentEmail) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        if (!test.isActive) {
            return res.status(400).json({ message: 'This test is no longer active' });
        }

        // Check expiry date
        if (test.expiryDate && new Date() > new Date(test.expiryDate)) {
            return res.status(400).json({ message: 'This test has expired and is no longer accepting responses' });
        }

        // Check access code if applicable
        if (test.accessCode && test.accessCode !== accessCode) {
            return res.status(401).json({ message: 'Invalid access code' });
        }

        // Check if this student already attempted
        const existingAttempt = await Attempt.findOne({
            studentEmail: studentEmail.toLowerCase().trim(),
            test: testId
        });

        if (existingAttempt) {
            if (existingAttempt.completed) {
                // If multiple attempts NOT allowed, block
                if (!test.allowMultipleAttempts) {
                    return res.status(400).json({ message: 'You have already completed this test. Only one attempt is allowed per email.' });
                }
                // If multiple attempts allowed, create a new attempt
                const newAttempt = await Attempt.create({
                    studentName: studentName.trim(),
                    studentEmail: studentEmail.toLowerCase().trim(),
                    test: testId,
                    totalQuestions: test.totalQuestions,
                    startTime: Date.now()
                });
                return res.status(201).json(newAttempt);
            }
            // Resume incomplete attempt
            return res.json(existingAttempt);
        }

        const newAttempt = await Attempt.create({
            studentName: studentName.trim(),
            studentEmail: studentEmail.toLowerCase().trim(),
            test: testId,
            totalQuestions: test.totalQuestions,
            startTime: Date.now()
        });

        res.status(201).json(newAttempt);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error starting attempt' });
    }
};

// @desc    Save progress (autosave — no auth)
// @route   PUT /api/attempts/:id/save
// @access  Public
const saveProgress = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.completed) {
            return res.status(400).json({ message: 'Test already submitted' });
        }

        attempt.answers = req.body.answers;
        if (req.body.tabSwitchCount !== undefined) {
            attempt.tabSwitchCount = req.body.tabSwitchCount;
        }
        await attempt.save();

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving progress' });
    }
};

// @desc    Submit test (no auth)
// @route   POST /api/attempts/:id/submit
// @access  Public
const submitAttempt = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('test');

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.completed) {
            return res.status(400).json({ message: 'Test already submitted' });
        }

        // Update answers with final data (including timeSpent)
        if (req.body.answers) {
            attempt.answers = req.body.answers;
        }
        if (req.body.tabSwitchCount !== undefined) {
            attempt.tabSwitchCount = req.body.tabSwitchCount;
        }

        attempt.endTime = Date.now();
        attempt.completed = true;

        // Calculate score
        let score = 0;
        const questionIds = attempt.answers.map(a => a.questionId);
        const questions = await Question.find({ '_id': { $in: questionIds } });

        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        attempt.answers.forEach(ans => {
            const question = questionMap[ans.questionId?.toString()];
            if (question) {
                if (ans.selectedOption === question.correctAnswer) {
                    score++;
                    ans.isCorrect = true;
                } else {
                    ans.isCorrect = false;
                }
            }
        });

        attempt.score = score;
        attempt.timeTaken = Math.round((attempt.endTime - attempt.startTime) / 1000);

        await attempt.save();

        // Return based on showResults flag
        const test = await Test.findById(attempt.test._id || attempt.test);

        if (test && test.showResults) {
            res.json({
                _id: attempt._id,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                timeTaken: attempt.timeTaken,
                showResults: true,
                testTitle: test.title
            });
        } else {
            res.json({
                _id: attempt._id,
                showResults: false,
                testTitle: test ? test.title : 'Assessment'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting test' });
    }
};

// @desc    Get attempt result (public — respects showResults flag)
// @route   GET /api/attempts/:id
// @access  Public
const getAttempt = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id)
            .populate({
                path: 'test',
                select: 'title showResults duration'
            });

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (!attempt.completed) {
            return res.json(attempt);
        }

        // If showResults is off, return limited data
        if (!attempt.test.showResults) {
            return res.json({
                _id: attempt._id,
                showResults: false,
                completed: true,
                testTitle: attempt.test.title
            });
        }

        // Full results
        res.json({
            _id: attempt._id,
            studentName: attempt.studentName,
            studentEmail: attempt.studentEmail,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            timeTaken: attempt.timeTaken,
            showResults: true,
            completed: true,
            testTitle: attempt.test.title,
            answers: attempt.answers
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attempt' });
    }
};

// @desc    Get all attempts for a test (admin) — includes leaderboard
// @route   GET /api/attempts/test/:testId
// @access  Admin
const getAttemptsForTest = async (req, res) => {
    try {
        const attempts = await Attempt.find({
            test: req.params.testId,
            completed: true
        })
            .populate({
                path: 'test',
                select: 'title duration totalQuestions',
                populate: {
                    path: 'questions',
                    select: 'text options correctAnswer type difficulty'
                }
            })
            .sort({ score: -1, timeTaken: 1 }); // Sort by score desc, then by time asc (leaderboard order)

        res.json(attempts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching attempts' });
    }
};

module.exports = { startAttempt, saveProgress, submitAttempt, getAttempt, getAttemptsForTest };
