// Dependencies
var mongoose = require('mongoose');
const collectionName = 'qa_stream';

// Setup schema
var inputSchema = mongoose.Schema({
    intent: {
        type: String,
        required: true
    },
    questions: {
        type: Array,
        required: true
    },
    answers: {
        type: Array,
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
