// Dependencies
var mongoose = require('mongoose');
const collectionName = 'qa_records';

// Setup schema
var inputSchema = mongoose.Schema({
    intentName: {
        type: String,
        required: true
    },
    documentId: {
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
