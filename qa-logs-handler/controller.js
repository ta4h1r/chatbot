Table_answered = require('./inputModel_answered');
Table_unanswered = require('./inputModel_unanswered');

// VIEW ALL
exports.index = async (req, res) => {
	//console.log(req.body);

	// Send back a response immediately so that Dialogflow does not freeze
	// If Dialogflow holds on a response for a conssistent 5 seconds, the backend
	// server is probably down and needs to be checked.
	res.json({
		status: 'OK'
	});

	try {
		console.log('Checking question...');
		var answered = await check(req);
		if (!answered) {
			addData(req, res, Table_unanswered);
		} else {
			addData(req, res, Table_answered);
		}
	} catch (error) {
		console.log(error)
	}

};


async function addData(req, res, tableName) {

	// Ignoring small talk
	if (req.body.queryResult.intent.displayName.includes('smalltalk')) {
		console.log('Avoided smalltalk. No changes were made.');
		return;
	}

	// Ignoring if already exists in unanswered_questions collection
	if (tableName == Table_unanswered && await assess(req, res, tableName)) {
		console.log('Done');
		return;
	}

	// Adding data to appropriate collection
	var input = new tableName();
	input.intent = req.body.queryResult.intent.displayName;
	input.question = req.body.queryResult.queryText;
	input.answer = req.body.queryResult.fulfillmentText;
	input.intentDetectionConfidence = req.body.queryResult.intentDetectionConfidence;
	input.responseId = req.body.responseId;

	// Show where the data is being routed
	// var answered = await check(req);
	if (tableName == Table_unanswered) {
		console.log('Logging to unanswered_questions collection: ' + input.question);
	} else {
		console.log('Logging to qa_logs collection: ' + input.question);
	}

	// Save the doc and check for errors
	input.save((err) => {
		if (err) {
			console.log(err);
		}
	});
	console.log('Done');

}


function check(req) {
	// Checks to see if the question has been answered

	return new Promise ((resolve, reject) => {
		console.log(req.body);
		if (req.body.queryResult.intent.displayName == "Default Fallback Intent - fallback" || req.body.queryResult.intent.displayName == "Default Fallback Intent") {
			resolve(false);
		} else {
			resolve(true);
		}

	});

}


function assess(req, res, tableName) {
	// Checks to see if the question already exists in unanswered qs

	console.log('Assessing unanswered collection...');
	return new Promise ((resolve, reject) => {
		tableName.find({question: req.body.queryResult.queryText}, (err, doc) => {
			console.log(doc);
			if (doc.length != 0) {
				console.log('Unanswered question already exists. No changes were made.');
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});

}
