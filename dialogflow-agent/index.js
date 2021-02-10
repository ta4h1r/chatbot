// Dependencies
let express = require('express'); 					// Port handler
let apiRoutes = require('./api-routes'); 			// Response definitions
let bodyParser = require('body-parser'); 			// For handling request data
var cors = require('cors');                 		// Enables cors policies on the resource for web interaction

// Definitions
let app = express();
var port = process.env.PORT || 8006;

const dbName = 'qa-module';

main();

async function main() {

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
	});


}
