var mongoose = require('mongoose');

const collectionName = 'unanswered_question';

// Setup schema
var inputSchema = mongoose.Schema({
    
    question: {
        type: String,
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
