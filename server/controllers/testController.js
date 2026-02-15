const Test = require('../models/Test');
const Question = require('../models/Question');
const { parseExcelRequest } = require('../utils/excelParser');

// @desc    Upload questions via Excel
// @route   POST /api/tests/upload-questions
// @access  Admin
const uploadQuestions = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }

        const questionsData = parseExcelRequest(req.file.buffer);
        res.json(questionsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error parsing Excel file' });
    }
};

// @desc    Create bulk questions
// @route   POST /api/tests/create-questions
// @access  Admin
const createQuestions = async (req, res) => {
    try {
        const questions = await Question.insertMany(req.body.map(q => ({
            ...q,
            createdBy: req.user._id
        })));
        res.status(201).json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error saving questions' });
    }
};

// @desc    Create a new test
// @route   POST /api/tests
// @access  Admin
const createTest = async (req, res) => {
    try {
        const { title, duration, totalQuestions, shuffleQuestions, shuffleOptions, showResults, selectedQuestions, accessCode, allowMultipleAttempts, expiryDate } = req.body;

        // Generate a unique short link
        const uniqueLink = Math.random().toString(36).substring(2, 10);

        const test = await Test.create({
            title,
            duration,
            totalQuestions,
            shuffleQuestions,
            shuffleOptions,
            showResults: showResults || false,
            allowMultipleAttempts: allowMultipleAttempts !== false,
            expiryDate: expiryDate || null,
            accessCode,
            uniqueLink,
            questions: selectedQuestions || [],
            createdBy: req.user._id
        });

        res.status(201).json(test);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating test' });
    }
};

// @desc    Get test by unique link (PUBLIC - for students)
// @route   GET /api/tests/link/:uniqueLink
// @access  Public
const getTestByLink = async (req, res) => {
    try {
        const test = await Test.findOne({ uniqueLink: req.params.uniqueLink })
            .select('title duration totalQuestions accessCode isActive showResults allowMultipleAttempts expiryDate');

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        if (!test.isActive) {
            return res.status(400).json({ message: 'This test is no longer active' });
        }

        // Check expiry
        const isExpired = test.expiryDate && new Date() > new Date(test.expiryDate);
        if (isExpired) {
            return res.status(400).json({ message: 'This test has expired' });
        }

        // Return metadata only (no questions yet)
        res.json({
            _id: test._id,
            title: test.title,
            duration: test.duration,
            totalQuestions: test.totalQuestions,
            hasAccessCode: !!test.accessCode,
            isActive: test.isActive,
            allowMultipleAttempts: test.allowMultipleAttempts,
            expiryDate: test.expiryDate
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching test' });
    }
};

// @desc    Get test questions (for active attempt)
// @route   GET /api/tests/:id/questions
// @access  Public (but should only be called once attempt is started)
const getTestQuestions = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('questions', '-correctAnswer'); // Never send correct answers!

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        let questions = test.questions;

        // Shuffle questions if enabled
        if (test.shuffleQuestions) {
            questions = [...questions].sort(() => Math.random() - 0.5);
        }

        // Shuffle options if enabled
        if (test.shuffleOptions) {
            questions = questions.map(q => {
                const qObj = q.toObject();
                qObj.options = [...qObj.options].sort(() => Math.random() - 0.5);
                return qObj;
            });
        }

        res.json({
            testId: test._id,
            title: test.title,
            duration: test.duration,
            questions
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions' });
    }
};

// @desc    Get test by ID (Admin)
// @route   GET /api/tests/:id
// @access  Admin
const getTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('questions');

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(404).json({ message: 'Test not found' });
    }
};

// @desc    Get all tests (Admin)
// @route   GET /api/tests
// @access  Admin
const getTests = async (req, res) => {
    try {
        const tests = await Test.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

        // For each test, get attempt count
        const Attempt = require('../models/Attempt');
        const testsWithStats = await Promise.all(tests.map(async (test) => {
            const attemptCount = await Attempt.countDocuments({ test: test._id, completed: true });
            const attempts = await Attempt.find({ test: test._id, completed: true });
            const avgScore = attempts.length > 0
                ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(1)
                : 0;

            return {
                ...test.toObject(),
                attemptCount,
                avgScore
            };
        }));

        res.json(testsWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching tests' });
    }
};

// @desc    Get all questions (Admin)
// @route   GET /api/tests/questions/all
// @access  Admin
const getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions' });
    }
};

// @desc    Toggle test active status
// @route   PUT /api/tests/:id/toggle
// @access  Admin
const toggleTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        test.isActive = !test.isActive;
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling test' });
    }
};

// @desc    Delete a test and its attempts
// @route   DELETE /api/tests/:id
// @access  Admin
const deleteTest = async (req, res) => {
    try {
        const Attempt = require('../models/Attempt');
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Delete all attempts for this test
        await Attempt.deleteMany({ test: test._id });
        // Delete the test
        await Test.findByIdAndDelete(req.params.id);

        res.json({ message: 'Test and all related attempts deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting test' });
    }
};

// @desc    Delete a single question
// @route   DELETE /api/tests/questions/:id
// @access  Admin
const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        await Question.findByIdAndDelete(req.params.id);

        // Also remove question from any tests that reference it
        await Test.updateMany(
            { questions: req.params.id },
            { $pull: { questions: req.params.id } }
        );

        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting question' });
    }
};

// @desc    Delete all questions
// @route   DELETE /api/tests/questions/all
// @access  Admin
const deleteAllQuestions = async (req, res) => {
    try {
        const result = await Question.deleteMany({ createdBy: req.user._id });
        res.json({ message: `${result.deletedCount} questions deleted` });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting questions' });
    }
};

module.exports = { uploadQuestions, createQuestions, createTest, getTest, getTests, getTestByLink, getTestQuestions, getAllQuestions, toggleTest, deleteTest, deleteQuestion, deleteAllQuestions };

