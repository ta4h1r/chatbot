/**
	This module watches for changes on a mongodb table specified by 
	dbName and the collectionName of inputModel.js. 
	
	Each change is piped to the Dialogflow chatbot agent specified by the Google Cloud Platform 
	projectID and the dialogflow API client.

*/

// Dependencies
let express = require('express'); 					// Port handler
const fs = require('fs')  				    		// readFile function is defined
let mongoose = require('mongoose');		 			// For Mongo DB interactions
let apiRoutes = require('./api-routes'); 			// Response definitions 
let bodyParser = require('body-parser'); 			// For handling request data
var cors = require('cors');                 		// Enables cors policies on the resource for web interaction
const streamHandler = require('./streamHandler'); 	// For watching the db and making appropriate changes to chatbot
Table = require('./inputModel');

// Definitions 
let app = express();
var port = process.env.PORT || 8002; 

const dbName = 'qa-module';

main(); 

async function main() {
	
	const pass = await getText();
	const uri = 'mongodb+srv://ta4h1r:' + pass + '@sandbox-cluster-0-2wusu.mongodb.net/' + dbName + '?retryWrites=true&w=majority';
	const options = {
		useUnifiedTopology: true,
		useNewUrlParser: true
	};
	
	// Connect to Mongo DB and set connection variable 
	mongoose.connect(uri, options);

	// Check for succesful DB connection
	var db = mongoose.connection;
	if(!db)
		console.log("Error connecting DB");
	else
		console.log("DB connected");
	
	// Configure bodyparser to handle post requests 
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(bodyParser.json());
	
	// Set cors policy 
	app.use(cors());
	
	// Send default message for root path 
	app.get('/', (req, res) => res.send('Nothing to do here.'));

	// Configure router for /api path
	app.use('/api', apiRoutes);

	// Start listening on the server
	app.listen(port, async () => {
		console.log('Listening on port ' + port);
		streamHandler.main;
	});
	
	
}


function getText() {
	
	return new Promise((resolve, reject) => {
		fs.readFile('pass.txt', 'utf-8', async (err, data) => { 
			if (err) throw err; 
			resolve(data);
		});
	});
	
} 


	
	
	
	
	
	
	
	
	
	
	
	
	