const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['MCQ', 'True/False'],
        required: true
    },
    options: [{
        type: String
    }],
    correctAnswer: {
        type: String, // Store the correct option index or text
        required: true
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
