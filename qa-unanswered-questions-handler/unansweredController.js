Input = require('./inputModel');

// LIST ALL (GET)
exports.list = (req, res) => {
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
};


// SUBMIT (POST)
exports.submit = async (req, res) => {
	
	// Check the QA table to see if the specified intent already exists
	function check(req) {
		console.log('Checking...');
		return new Promise ((resolve, reject) => {
			const object = {
				intent: req.body.intent
			};
			Input.qa.find(object, (err, doc) => {
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


	// If the intent exists, update it. Otherwise, create a new intent.
	try {
		var exists = await check(req);
		if (exists != false) {
			console.log('Intent exists. Updating...');
			update(req, res);
		} else {
			var input = new Input.qa(); 
			input.intent = req.body.intent ? req.body.intent : input.intent;
			input.questions = req.body.questions; 
			input.answers = req.body.answers; 

			console.log('No existing intent found. Adding new intent: ' + input.intent);
			
			// Save the doc and check for errors 
			input.save((err) => {
				if (err) {
					res.json(err);
				}
			});
			console.log("Done");
		}
		
		// Delete the selected question(s) from the UQA table
		var unansweredQList = [];
		Input.uqa.find(null, (err, doc) => {
			if (err) {
				console.log(err);
				res.json({
					message: "Unable to delete",
					error: err
				});
			} else {
				for (var i = 0; i < doc.length; i++) {
					if (req.body.questions.includes(doc[i].question)) {
						//console.log(doc[i]);
						unansweredQList.push(doc[i].question);
					}
					
				}
				
				unansweredQList.forEach(item => {
					console.log('Deleting question: ' + item);
					var object = {
						question: item
					}
					Input.uqa.deleteOne(object, (err, doc) => {
						if (err) res.send(err);
					});
				});
				
				res.json({
					status: 'Success',
					message: 'Questions deleted',
					data: unansweredQList
				});
			}
			
		});
		
		
		
		
		
	} catch (error) {
		console.log(error)
	}
	
};

// Updates an existing intent in the QA table
function update(req, res) {
	var filter = {
		intent: req.body.intent		
	};
	
	Input.qa.find(filter, (err, doc) => {
		if (err) res.send(err);
		
		//console.log(doc[0].questions);
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
		
	
		var update = { 
			questions: questions,
			answers: answers,
			intent: req.body.intent ? req.body.intent : doc.intent
		};
		var options = { multi: true };
	
		Input.qa.updateOne(filter, update, options, callback);
		
		function callback (err, numAffected) {
			if (err) res.send(err);
			console.log('Done');
			//console.log(numAffected);    // numAffected is the number of updated documents
		} 
		
	});

};

	
// DELETE 
exports.delete = (req, res) => {
	for (var i = 0; i < req.body.questions.length; i++) {
		console.log('Deleting question ' + req.body.questions[i]);
		Input.uqa.deleteOne({
			question: req.body.questions[i]
		}, (err, doc) => {
			if (err) res.send(err);
			res.json({
				status: 'Success',
				message: 'Question deleted'
			});
			console.log('Done');
		});
	}
};
