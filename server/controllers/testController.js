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

        // Save to DB? Or just return preview? 
        // Requirement: "Show preview before saving" -> So we store temporary or just return data.
        // But also "Parse and store questions in database" -> "Allow admin to edit if needed".
        // Best approach: Return parsed data, let frontend send it back to 'create-questions' API.

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
}

// @desc    Create a new test
// @route   POST /api/tests
// @access  Admin
const createTest = async (req, res) => {
    try {
        const { title, duration, totalQuestions, shuffleQuestions, shuffleOptions, selectedQuestions } = req.body;

        // If selectedQuestions (IDs) are passed, use them.
        // If not, "System should randomly generate questions based on admin selection" (e.g. category, parsing uploaded sheets).
        // For simplicity now, let's assume admin passes question IDs after uploading/selecting.

        // Logic to randomly select questions if IDs not provided (Future enhancement based on category)

        const uniqueLink = Math.random().toString(36).substring(7);

        const test = await Test.create({
            title,
            duration,
            totalQuestions,
            shuffleQuestions,
            shuffleOptions,
            uniqueLink,
            questions: selectedQuestions,
            createdBy: req.user._id
        });

        res.status(201).json(test);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating test' });
    }
};

// @desc    Get test by unique link/ID
// @route   GET /api/tests/:id
// @access  Public (Protected by Access Code if needed, implemented in future)
const getTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('questions', '-correctAnswer'); // Don't send correct answers to client!

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
    const tests = await Test.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(tests);
}

module.exports = { uploadQuestions, createQuestions, createTest, getTest, getTests };
