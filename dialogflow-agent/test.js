// Dependencies
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

// Definitions
const sessionId = uuid.v4();
const projectId = 'sanbot-v2-0-ssvlgm';
// const projectId = 'sanbot-eu2-mob9';
// const query = 'Who is the general manager';
const query = 'Who is John Cena?';
getResponse(query);

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
 async function getResponse(query) {

   const sessionClient = new dialogflow.SessionsClient({
     keyFilename: "sanbot-v2-0-ssvlgm-20dabc1b6363.json"
   });
   // const sessionClient = new dialogflow.SessionsClient({
   //   keyFilename: "sanbot-eu2-mob9-dab2b135fd5f.json"
   // });

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
   } else {
     console.log(`  No intent matched.`);
   }
 }
