Input = require('./inputModel');

// VIEW ALL 
exports.index = (req, res) => {
	console.log('Getting all table data');
	Input.get((err, documents) => {
		if (err) {
			res.json({
				status: "error", 
				message: err
			});
		}
		res.json({
			status: "success",
			message: "Documents retrieved successfully",
			data: documents
		});
			console.log("Done");
	});
;
};


// NEW
exports.new = async (req, res) => {
	
	// Check to see if the specified intent already exists
	function check(req) {
		console.log('Checking...');
		return new Promise ((resolve, reject) => {
			const object = {
				intent: req.body.intent
			};
			Input.find(object, (err, doc) => {
				if (err) {
					reject(err);
				} else {
					if (doc.length != 0) {
						resolve(true);
					} else {
						resolve(false);
					}
				} 
			});
			
		});
	}

	try {
		var exists = await check(req);
		if (exists != false) {
			res.json({
				message: 'Intent already exists. No changes were made'
			});
		} else {
			var input = new Input(); 
			input.intent = req.body.intent ? req.body.intent : input.intent;
			input.questions = req.body.questions; 
			input.answers = req.body.answers; 

			console.log('Adding new intent: ' + input.intent);
			
			// Save the doc and check for errors 
			input.save((err) => {
				if (err) {
					res.json(err);
				}
				res.json({
					message: 'Added intent successfully', 
					data: input
				});
			});
			console.log("Done");
		}
	} catch (error) {
		console.log(error)
	}
	
};


// VIEW ONE 
exports.view = (req, res) => {
	console.log("Getting intent: " + req.params.intent + "...");
	var object = {
		intent: req.params.intent
	};
	Input.find(object, (err, doc) => {
		if (err) {
			res.send(err);
		} else {
			if (doc.length != 0) {
				res.json({
					message: 'Intent loaded',
					data: doc
				});
			} else {
				res.json({
					message: 'Intent not found',
					data: doc
				});
			};				
		};
		console.log("Done");
	});
};


// UPDATE
exports.update = (req, res) => {
	console.log(req.params.intent);
	var filter = {
		intent: req.params.intent		
	};
	
	Input.find(filter, (err, doc) => {
		if (err) res.send(err);
		var questions = doc[0].questions;
		var answers = doc[0].answers;
		const newAnswers = req.body.answers; 
		const newQuestions = req.body.questions;
		
		for (const answer of newAnswers) {
			if (answers.includes(answer)) {
				console.log("Existing answer '" + answer + "' omitted.");
			} else {
				answers.push(answer);
				console.log("Adding new answer '" + answer + "...");
			}
		}
		
		for (const question of newQuestions) {
			if (questions.includes(question)) {
				console.log("Existing question '" + question + "'  omitted.");
			} else {
				questions.push(question);
				console.log("Adding new question '" + question + "'...");
			}
		}
		
		console.log(req.body.intent);
		var update = { 
			questions: questions,
			answers: answers,
			intent: req.body.intent ? req.body.intent : doc[0].intent
		};
		var options = { multi: true };
	
		Input.updateOne(filter, update, options, callback);
		
		function callback (err, numAffected) {
			if (err) res.send(err);
			res.send({
				message: 'Update success',
				data: doc
			});
			console.log('Done');
			//console.log(numAffected);    // numAffected is the number of updated documents
		} 
		
	});
	

};


// DELETE
exports.delete = (req, res) => {
	console.log('Deleting intent ' + req.params.intent);
	Input.deleteOne({
		intent: req.params.intent
	}, (err, doc) => {
		if (err) res.send(err);
		res.json({
			status: 'Success',
			message: 'Intent deleted'
		});
	});
};
