var mongoose = require('mongoose');

const uqaCollection = 'unanswered_question';
const qaCollection = 'qa_stream';

// Setup schemas
var inputSchemaUQA = mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});

var inputSchemaQA = mongoose.Schema({
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
var Input = module.exports = {
	qa: mongoose.model(qaCollection, inputSchemaQA), 
	uqa: mongoose.model(uqaCollection, inputSchemaUQA)
}

module.exports.get = function (callback, limit) {
    Input.uqa.find(callback).limit(limit);
}