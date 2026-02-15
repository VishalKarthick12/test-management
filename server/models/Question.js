const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['MCQ', 'True/False', 'multiple_choice'],
        required: true,
        set: function (val) {
            // Normalize type values
            if (val === 'multiple_choice' || val === 'mcq') return 'MCQ';
            if (val === 'true_false' || val === 'true/false') return 'True/False';
            return val;
        }
    },
    options: [{
        type: String
    }],
    correctAnswer: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
        set: function (val) {
            return val ? val.toLowerCase() : 'medium';
        }
    },
    category: {
        type: String,
        default: 'General'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Question', questionSchema);
