// Dependencies
var AWS = require('aws-sdk');

//Definitions
var dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback){
    console.log(event);
    
    var params = {
        'TableName': 'qa-unanswered-questions-table',
        'ProjectionExpression': 'question'
    };

    if (event.command == "List") {
        var questions = [];
        listQuestions(questions, callback);
    } else {
        dynamo.scan(params, onScan);    
    }    

   
    function onScan (error, data) {
    
        if (error) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(error, null, 2));
        } else {
            console.log("Scanning...");
            if (data.Items.length == 0) {
                console.log("Requested database is empty. No changes were made.");
            } else {
                var unansweredQList = [];
				// Going through UQA table
                data.Items.forEach((item) => {
					// Check if unanswered request q's are in the table
                    if (event.questions.includes(item.question)) {
                        console.log('Unanswered question found: ' + item.question);
                        unansweredQList.push(item.question);
                        console.log(unansweredQList);
                    } else {
                        console.log("Unanswered question not found.");
                        return;
                    }
                });
                
                const table = 'qa-stream-table';
                switch (event.command) {
                    case "Submit": 
                        /**
                         * Updates the chatbot agent and deletes the corresponding question from the unanswered questions DB 
                         */
                        params = queryParams(event, table);
                        dynamo.query(params, function(err, data) {
                        if (err) {
                            console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Query succeeded.");
                            if (data.Items.length == 0) {
                                console.log("No existing intent found. Adding new intent...");
                                const newIntentParams = buildNewParams(event, table);
                                dynamo.put(newIntentParams, function(err, data) {
                                    if (err) {
                                        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                                    } else {
                                        console.log("Done.");
                                    }
                                });
                            } else {
                                //console.log(data);
                                console.log("Existing intent found: " + data.Items[0].intent + ". Updating...");
                                pullCurrentData(event, table).then(response => {
                                    const newParams = addNewParams(event, response.Item, table);
                                    dynamo.put(newParams, function(err, data) {
                                        if (err) {
                                            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                                        } else {
                                            console.log("Done.");
                                        }
                                    });
                                });
                                    console.log("Done.");
                                }
                            }
                        });
                        
                        //Deletes the selected question(s) from the unanswered questions DB 
                        unansweredQList.forEach(item => {
                            console.log('Deleting question: ' + item);
                            const deleteParams = {
                            	TableName: 'qa-unanswered-questions-table',
                            	Key:{
                            		"question": item
                            	},
                            	ConditionExpression:"question = :q",
                            	ExpressionAttributeValues: {
                            		":q": item
                            	}
                            };
                            dynamo.delete(deleteParams, function(err, data) {
                            	if (err) {
                            		console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                            	} else {
                            		console.log("Done.");
                            	}
                            });
                        });
                        
                        break;
                    case "Delete":
                        //Deletes the selected question(s) from the unanswered questions DB 
                        unansweredQList.forEach(item => {
                            console.log('Deleting question: ' + item);
                            const deleteParams = {
                            	TableName: 'qa-unanswered-questions-table',
                            	Key:{
                            		"question": item
                            	},
                            	ConditionExpression:"question = :q",
                            	ExpressionAttributeValues: {
                            		":q": item
                            	}
                            };
                            dynamo.delete(deleteParams, function(err, data) {
                            	if (err) {
                            		console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                            	} else {
                            		console.log("Done.");
                            	}
                            });
                        });
                        break;
                    default:
                        console.log('Invalid command. No changes were made.');
                        break;
                }
            }
        }
        
        // continue scanning if we have more entries, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            dynamo.scan(params, onScan);
        }
        
    } 
    
};


function queryParams(event, table) {

    const params = {
        TableName: table,
        ProjectionExpression: 'intent',
        KeyConditionExpression: 'intent = :int',
        ExpressionAttributeValues: {
            ':int': event.intent
        }
    };
    
    return params;
    
}


function addNewParams(newData, data, table) {
    
    for (const answer of newData.answers) {
        if (data.answers.includes(answer)) {
            console.log("Existing answer '" + answer + "' omitted.");
        } else {
            data.answers.push(answer);
            console.log("New answer '" + answer + "' added.");
        }
    }
    
    for (const question of newData.questions) {
        if (data.questions.includes(question)) {
            console.log("Existing question '" + question + "'  omitted.");
        } else {
            data.questions.push(question);
            console.log("New question '" + question + "' added.");
        }
    }
    
    var params = {
        TableName: table,
        Item:{
            "answers": data.answers,
            "intent": data.intent,
            "questions": data.questions,
        }
    };
   
    return params;
}


function buildNewParams(data, table) {
    
    var params = {
        TableName: table,
        Item:{
            "answers": data.answers,
            "intent": data.intent,
            "questions": data.questions,
        }
    };
    
    return params;
    
}


function pullCurrentData(event, table) {
    
    var params = {
        TableName: table,
        Key:{
            "intent": event.intent
        }
    };
    
    return dynamo.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            //console.log("GetItem succeeded.", JSON.stringify(data.Item, null, 2));
            return data.Item;
        }
    }).promise();
}


function listQuestions(questions, callback) {
    var params = {
        TableName: 'qa-unanswered-questions-table',
        ProjectionExpression: 'question'
    };
    
    dynamo.scan(params, onScan);
    console.log('params: ' + JSON.stringify(params));

    
    function onScan(err, data) {
        
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // print all keys
            console.log("Scan succeeded.");
            data.Items.forEach(function(q) {
               questions.push(q.question);
            });
        }
        
        // continue scanning if we have more entries, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            dynamo.scan(params, onScan);
        }
        
        callback(null, questions);
    }
    
}