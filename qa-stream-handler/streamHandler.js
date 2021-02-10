// Dependencies
const dialogflow = require('dialogflow');   			   // For Dialogflow interactions
Table = require('./inputModel');						   // For mongodb interactions
Records = require('./inputModelRecords');


// Definitions
const projectID = '****';
const client = new dialogflow.v2beta1.IntentsClient({
  keyFilename: "sanbot-v2-0-ssvlgm-20dabc1b6363.json"
});

let queue = [];
var queueEmpty = true;
let j = 0;
const maxRetries = 2;
const waitMillis = 4000;   // Ensures 60 req. per minute constraint; client. requests are made at multiple times per CRUD operation


module.exports = streamHandler = {
	main: main(),
	getIntent: getIntent
}


async function main() {
  // TODO: Sync dialogflow agent and qa_streams collection
  // TODO: add retry on resources exhausted exception

	console.log('Running stream...');
	// Create a change stream. The 'change' event gets emitted when there's a
	// change in the database

	Table.watch(null, {fullDocument:'updateLookup'})  // Start watching table
	.on('change', async function (data) {
		// Do stuff with data
		console.log(data);
    // Queue data to handleStream
    queue.push(data);

    if (queue.length == 0) {
      queueEmpty = true;
    }

    if (queueEmpty) {
      putItems(queue);
    }

  });

}

async function putItems(queue) {

  if (queue.length != 0) {
    queueEmpty = false;
    console.log("Files in queue: " + queue.length);
  }

  try {
    handleStream(queue[0]);
  } catch (e) {
    console.log("putItems: Exception: " + e)
      setTimeout(( ) => {dequeue(queue)}, waitMillis);                       // Move to next queue item
  }

}
function dequeue(queue) {
  queue.shift();
  if (queue.length != 0) {                // Don't continue if we're out of items.
    queueEmpty = false;
    console.log('DONE.');
    putItems(queue);                     // Call again with the rest of the items.
  } else {
    queueEmpty = true;
    console.log('DONE ALL.');
    restart();
    return;
  }
}
function restart() {
  console.log("Restarting");
  queue = [];
  j = 0;
  queueEmpty = true;
  console.log("Files in queue: " + queue.length);
}
function retry(queue) {
  j += 1;
  if (queue.length != 0) {
    queueEmpty = false;
    putItems(queue);                     // Call again with the rest of the items.
  } else {
    queueEmpty = true;
    return;
  }
}

let intentName;
async function handleStream(data) {

	const streamOperation = await data.operationType;

	let questions;
	let answers;
	let trainingPhrases;
	let messages;
  let documentId;

	try {

		if (streamOperation != 'delete') {
			intentName = data.fullDocument.intent;
			questions = data.fullDocument.questions;
			answers = data.fullDocument.answers;
      documentId = data.documentKey._id;
			trainingPhrases = buildTrainingPhrasesJSON(questions);
			messages = buildMesssagesJSON(answers);
		} else {
      documentId = data.documentKey._id;
    }

		switch (streamOperation) {

			case 'insert':
				console.log('case: INSERT. Updating bot...');
        populateRecords(documentId, intentName);                         // Attach _id to intentName with a document in a sepaeate collection for reference upon delete.
				updateBot(projectID, intentName, trainingPhrases, messages);
				break;

			case 'update':
				console.log('case: MODIFY. Updating bot...');
				updateBot(projectID, intentName, trainingPhrases, messages, documentId);
				break;

			case 'delete':
				console.log('case: REMOVE. Updating bot...');
				deleteFromBot(projectID, documentId);
        break;

			default:
			console.log('Invalid switch case.');

		}

	} catch (err) {
		console.error(err);
	}

}

function populateRecords(documentId, intentName) {
  console.log("populateRecords: Document _id: " + documentId);
  console.log("populateRecords: intentName: " + intentName);

  // Put things in db
  try {
    var records = new Records();
    records.documentId = documentId;
    records.intentName = intentName;

    // console.log('populateRecords: Adding new record: documentId: ' + records.documentId);
    // console.log('populateRecords: Adding new record: intentName: ' + records.intentName);

    // Save the doc and check for errors
    records.save((err) => {
      if (err) {
        console.log("populateRecords: save error: " + err)
      }
    });
    console.log("populateRecords: Done");
	} catch (error) {
		console.log("populateRecords: Error: " + error)
	}

}

async function getRecord(documentId) {
  console.log("getRecord: Document _id: " + documentId);
  var filter = {
    documentId: documentId
  };

  // Query for intentName associated with documentId
  try {
    var doc = await Records.find(filter, async (err, doc) => {
      if (err) throw err;

      // Delete record
      Records.deleteOne({
        documentId: documentId
      }, (err, doc) => {
        if (err) throw err;
      });
    });

    var intentName = doc[0].intentName;
    console.log("getRecord: intentName: " + intentName);

    return intentName;
  } catch (e) {
    console.log("getRecord: Record.find exception: " + e);
    return null;
  }

}

function getIntent(req, res) {

	intent = req.body.intent;
	res.json({
			intent: intent
	});
	extract(intent);

}


function extract(intent) {
	intentName = intent;
}


function buildTrainingPhrasesJSON(questions) {
  /**
  Takes in a JSON object of questions sent from DynamoDB and returns the format
  to be passed to Dialogflow intent client
  */
  const trainingPhrases  = [];

  for (const question of questions) {


  	  trainingPhrases.push({
  		"type": "EXAMPLE",
  		"parts": [
  			{
  				"text": question
  			}
  		]
  	});
  }

  return trainingPhrases;

}


function buildMesssagesJSON(answers) {
   /**
  Takes in a JSON object of answers sent from DB and returns the format
  to be passed to Dialogflow intent client
  */

  const messages = [
      {
  			"text": {
  				"text": []
  			}

      }
    ];

  for (const answer of answers) {

    messages[0].text.text.push(answer);

  }

  return messages;

}



async function updateBot(projectID, intentName, trainingPhrases, messages, documentId) {

	 /**
		Checks if an intent exists and chooses whether to create a new intent or
		update an exiting intent with the specified parameters.
	 */

   var oldIntentName;
   var filter = {
     documentId: documentId
   };
   // Query for intentName associated with documentId
  try {
    var doc = await Records.findOne(filter, async (err, doc) => {
      if (err) throw err;
    });
    if (doc != null) {
      // console.log("updateBot: Records.findOne: ", doc);
      oldIntentName = doc.intentName;
    } else {
      oldIntentName = null;
      documentId = null;
    }
  } catch (e) {
    console.log("updateBot: Record.findOne exception: ", e);
  }
  console.log("updateBot: intentName: " + intentName);
  console.log("updateBot: oldIntentName: " + oldIntentName);
  if (oldIntentName != null && oldIntentName != intentName) {   // If an existing intentName has been modified
    // Update record with new intent name
    var update = {
			intentName: intentName,
		};
		var options = { multi: true };

    try {
      Records.updateOne(filter, update, options, function (err, numAffected) {
        console.log('updateBot: Records.updateOne: Done');
        // console.log(numAffected);    // numAffected is the number of updated documents
      });
    } catch (e) {
      console.log("updateBot: Records.updateOne: exception " , e);
    }

    // Delete old intent from bot
    deleteFromBotNoQ(projectID, oldIntentName);


  }

  getIntentID(projectID, intentName).then(intentID => {
			if (intentID) {
				//Do stuff
				console.log('Intent matched.\nUpdating...');
				pushTrainingPhrases(intentName, intentID, trainingPhrases, messages);
			} else {
				//Do stuff
				console.log('Intent does not exist.\nCreating new intent...');

				createNewIntent(intentName, trainingPhrases, messages);
				console.log('New intent created.\nAdding new data to ' + intentName + '...');
			};

			console.log('getIntentID: Done.');

		})
		.catch(rej => {
			console.error(rej);
		});
}


function createNewIntent(intentName, trainingPhrases, messages) {

	 /**
		Pushes the specified training phrases (questions) and messages (answers)
		to a new intent.
	 */

	const intent = {
		'displayName': intentName,
		'priority': 0,
		'webhookState': 'WEBHOOK_STATE_ENABLED',
		'trainingPhrases': trainingPhrases,
		'messages': messages
	};

  try {
    const formattedParent = client.projectAgentPath(projectID);
    const request = {
  	  parent: formattedParent,
  	  intent: intent,
  	};
    client.createIntent(request)
  	  .then(responses => {
    		const response = responses[0];
    		// doThingsWith(response)
    		//console.log(response);
        setTimeout(( ) => {dequeue(queue)}, waitMillis);
  	  })
  	  .catch(err => {
          console.log("createNewIntent: createIntent: Exception: " + err);
  		    console.log("createNewIntent: createIntent: Exception code: " + err.code);
          setTimeout(( ) => {dequeue(queue)}, waitMillis);
  	  });
  } catch (err) {
    console.log("createNewIntent: projectAgentPath: Exception code: " + err.code);
    setTimeout(( ) => {dequeue(queue)}, waitMillis);
  }

};


function getIntentID(projectID, intentName) {

	 /**
	  Returns the intent ID of the requested intent name
	  within the agent within the specified project.
	  */
  try {
    const formattedParent = client.projectAgentPath(projectID);

  	// Iterate over all elements.

  	return client.listIntents({parent: formattedParent})
  	  .then(responses => {
  		const resources = responses[0];
  		for (const resource of resources) {

  		  // check for a match
  		  if (resource.displayName == intentName) {
  			  const id = resource.name.split('intents/');
  			  console.log('\nMatched intent:  ' + resource.displayName + ',  ' + 'id: ' + id[1] + '\n');
  			  return id[1];
  		  };
  		}
  	  })
  	  .catch(err => {
  		    console.log("getIntentID: listIntents: Exception code: " + err.code);
  	  });
  } catch (err) {
    console.log("getIntentID: projectAgentPath: Exception code: " + err.code);
  }

};


async function deleteFromBot(projectID, documentId) {

	/**
		Deletes an intent from the specified agent
	*/
  const intentName = await getRecord(documentId); // Get name of intent to be deleted from Records collection

  if (intentName != null) {
    console.log("deleteFromBot: intentName: "  + intentName);

  	getIntentID(projectID, intentName).then(intentID => {
  			if (intentID) {
  				//Do stuff
  				console.log('Intent matched.\nDeleting...');
  				deleteIntent(intentID);
  			} else {
  				//Do stuff
  				console.log('deleteFromBot: Intent does not exist. No changes were made.');
          setTimeout(( ) => {dequeue(queue)}, waitMillis);
  			};
  		})
  		.catch(rej => {
        console.log("deleteFromBot: Rejection message: " + rej);
  		});
  } else {
    console.log("deleteFromBot: Could not find requested intentName in Records collection");
    setTimeout(( ) => {dequeue(queue)}, waitMillis);
  }

}


async function deleteFromBotNoQ(projectID, intentName) {

	/**
		Deletes an intent from the specified agent
	*/

  if (intentName != null) {
    console.log("deleteFromBot: intentName: "  + intentName);

  	getIntentID(projectID, intentName).then(intentID => {
  			if (intentID) {
  				//Do stuff
  				console.log('Intent matched.\nDeleting...');
  				deleteIntentNoQ(intentID);
  			} else {
  				//Do stuff
  				console.log('deleteFromBotNoQ: Intent does not exist. No changes were made.');
  			};
  		})
  		.catch(rej => {
        console.log("deleteFromBotNoQ: Rejection message: " + rej);
  		});
  } else {
    console.log("deleteFromBotNoQ: Could not find requested intentName in Records collection");
  }

}


function pushTrainingPhrases(intentName, intentID, trainingPhrases, messages) {

	 /**
		Sends questions and answers to the requested intent.
	 */
  try {
    const intent = {
      'name': client.intentPath(projectID, intentID),
      'displayName': intentName,
      'trainingPhrases': trainingPhrases,
      'messages': messages,
      'priority': 0,
      'webhookState': 'WEBHOOK_STATE_ENABLED'
    };

    const request = {
      intent: intent
    };

    client.updateIntent(request)              //NB: The updateIntent method is an overwrite by default
      .then(responses => {
        // const response = responses[0];
        setTimeout(( ) => {dequeue(queue)}, waitMillis);
      })
      .catch(err => {
        console.log("pushTrainingPhrases: updateIntent: Exception code: " + err.code);
        if (err.code == 3) {
          // This exception is thrown when an attempt is made to insert a duplicate intent
          // So we skip it
          setTimeout(( ) => {dequeue(queue)}, waitMillis);
        }
      });
  } catch (err) {
    console.log("pushTrainingPhrases: intentPath: Exception code: " + err.code);
  }

}


function deleteIntent(intentID) {

	try {
    const intent = {
  		'name': client.intentPath(projectID, intentID)
  	};

  	client.deleteIntent(intent)
    .then( () => {
      setTimeout(( ) => {dequeue(queue)}, waitMillis);
    })
    .catch(err => {
  		console.log("deleteIntent: deleteIntent: Exception code: " + err.code);
    });
  } catch (err) {
    console.log("deleteIntent: intentPath: Exception code: " + err.code);
  }

}

function deleteIntentNoQ(intentID) {

	try {
    const intent = {
  		'name': client.intentPath(projectID, intentID)
  	};

  	client.deleteIntent(intent)
    .catch(err => {
  		console.log("deleteIntentNoQ: deleteIntent: Exception code: " + err.code);
    });
  } catch (err) {
    console.log("deleteIntentNoQ: intentPath: Exception code: " + err.code);
  }

}
