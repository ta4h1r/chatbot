// Dependencies
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const {duckIt} = require("node-duckduckgo");

// Definitions
const sessionId = uuid.v4();
const projectId = 'sanbot-v2-0-ssvlgm';

exports.getResponse = async (req, res) => {

	const query = req.body.query;
	console.log(query);

	const sessionClient = new dialogflow.SessionsClient({
		keyFilename: "sanbot-v2-0-ssvlgm-20dabc1b6363.json"
	});

	const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

	// The text query request.
	const request = {
		session: sessionPath,
		queryInput: {
			text: {
				// The query to send to the dialogflow agent
				text: query,
				// The language used by the client (en-US)
				languageCode: 'en',
			},
		},
	};

	// Send request and log result
	const responses = await sessionClient.detectIntent(request);
	console.log('Detected intent');
	console.log(responses);
	const result = responses[0].queryResult;
	console.log(`  Query: ${result.queryText}`);
	console.log(`  Response: ${result.fulfillmentText}`);
	if (result.intent) {
		console.log(`  Intent: ${result.intent.displayName}`);

			res.json({
					status: "200",
					message: "Got response",
					data: {
						intent: result.intent.displayName,
						response: result.fulfillmentText,
					}
			});

	} else {
		console.log(`  No intent matched.`);
		res.json({
				status: "204",
				message: "No intent matched",
		});
	}

};
exports.getWiki = async (req, res) => {
	const query = req.body.query;
	console.log("getWiki: Getting Wiki for query: " + query);
  try {
		searchOptions = {
			noHtml: true,
			parentalFilter: 'Moderate',
			skipDisambig: true,
		}
    const result = await duckIt(query, searchOptions);
		console.log(result);
		const wikiResult = result.data.AbstractText;

		console.log("Got wiki: " + wikiResult);
		res.json({
				status: "200",
				message: "Got wiki",
				data: {
					wiki: wikiResult,
				}
		});

  } catch (err) {
    console.error('getWiki: oups', err);
		res.json({
				status: "400",
				message: "Wiki response error",
		});
		return null;
  }
}

// Helpers
async function pullWiki(query) {
	console.log("pullWiki: Getting Wiki for query: " + query);
  try {

		searchOptions = {
			noHtml: true,
			parentalFilter: 'Moderate',
			skipDisambig: true,
		}
    const result = await duckIt(query, searchOptions);
		const wikiResult = result.data.AbstractText;
		// console.log("Got wiki: " + wikiResult);

		return wikiResult;
  } catch (err) {

    console.error('pullWiki: oups', err);
		return null;

  }
}
function wikiExecute(query) {
    return new Promise(resolve => {
				resolve(pullWiki(query));       // truthy
		});
}
function maxWikiExecutionTime(maxExecutionTime) {
    return new Promise(resolve => {
				setTimeout(() => {resolve(false)}, maxExecutionTime);       // this setTimeout simulates your async action which sould not exced maxExecutionTime
		});
}
async function pullWikiConstrained(query, maxExecutionTime) {
    var exced = await Promise.race([wikiExecute(query), maxWikiExecutionTime(maxExecutionTime)]);    // gets the value of the first promise that resolves
		let sentence = null;
		if (exced) {
        console.log("Doesn't exceed max time");
				const splitdata = exced.split(". ");
				sentence = splitdata[0] + ". " + splitdata[1];
				console.log(sentence);
    } else {
        console.log("Exceed max time");
				sentence = null;
    }
		return sentence;

}  // Continues code if no result within maxExecutionTime (buggy)
