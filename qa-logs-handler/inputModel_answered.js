var mongoose = require('mongoose');

const collectionName = 'qa_log';

// Setup schema
var inputSchema = mongoose.Schema({
    intent: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
	responseId: {
        type: String,
        required: true
    },
	intentDetectionConfidence: {
        type: Number,
        required: true
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});

// Export Input model
var Input = module.exports = mongoose.model(collectionName, inputSchema);

module.exports.get = function (callback, limit) {
    Input.find(callback).limit(limit);
}
