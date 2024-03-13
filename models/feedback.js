const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    feedbackDate: { type: Date, default: Date.now },
    rating: { type: Number, required: true },
    comments: { type: String, required: false } 
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
