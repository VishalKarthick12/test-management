const Attempt = require('../models/Attempt');
const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Start a test attempt
// @route   POST /api/attempts/start
// @access  Student
const startAttempt = async (req, res) => {
    try {
        const { testId, accessCode } = req.body;
        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Check access code if applicable
        if (test.accessCode && test.accessCode !== accessCode) {
            return res.status(401).json({ message: 'Invalid access code' });
        }

        // Check for existing attempt
        const existingAttempt = await Attempt.findOne({
            student: req.user._id,
            test: testId
        });

        if (existingAttempt) {
            if (existingAttempt.completed) {
                return res.status(400).json({ message: 'You have already attempted this test' });
            }
            // Resume attempt
            return res.json(existingAttempt);
        }

        const newAttempt = await Attempt.create({
            student: req.user._id,
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

// @desc    Save progress (Autosave)
// @route   PUT /api/attempts/:id/save
// @access  Student
const saveProgress = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.student.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (attempt.completed) {
            return res.status(400).json({ message: 'Test already submitted' });
        }

        attempt.answers = req.body.answers;
        await attempt.save();

        res.json(attempt);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving progress' });
    }
};

// @desc    Submit test
// @route   POST /api/attempts/:id/submit
// @access  Student
const submitAttempt = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('test');

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.completed) {
            return res.status(400).json({ message: 'Test already submitted' });
        }

        attempt.endTime = Date.now();
        attempt.completed = true;

        // Calculate score
        let score = 0;
        const questions = await Question.find({
            '_id': { $in: attempt.answers.map(a => a.questionId) }
        });

        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        attempt.answers.forEach(ans => {
            const question = questionMap[ans.questionId.toString()];
            if (question) {
                // Check answer logic
                // If question.correctAnswer is index or text, handle accordingly
                // Assuming simple text match for now or index match
                // We stored correctAnswer as String in model. 
                // Let's assume exact string match for simplicity.
                if (ans.selectedOption === question.correctAnswer) {
                    score++;
                    ans.isCorrect = true;
                } else {
                    ans.isCorrect = false;
                }
            }
        });

        attempt.score = score;
        attempt.timeTaken = (attempt.endTime - attempt.startTime) / 1000;

        await attempt.save();

        res.json(attempt);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting test' });
    }
};


// @desc    Get attempt details (Results)
// @route   GET /api/attempts/:id
// @access  Student/Admin
const getAttempt = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id)
            .populate({
                path: 'test',
                populate: {
                    path: 'questions',
                    select: '-correctAnswer' // Security: exclude correct answer
                }
            })
            .populate('student', 'name email');

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        // Verify ownership
        if (req.user.role !== 'admin' && attempt.student._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attempt' });
    }
};

module.exports = { startAttempt, saveProgress, submitAttempt, getAttempt };
