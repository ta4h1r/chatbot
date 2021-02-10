// Dependencies
let router = require('express').Router();
var unansweredController = require('./unansweredController');

// Default API response 
router.get('/', (req, res) => {
	res.json({
		status: 'API working',
		message: 'Welcome to my world'
	});
});

// Table routes 
router.route('/qa-unanswered-questions-table')
	.get(unansweredController.list)                 // LIST ALL
	.post(unansweredController.submit)				// ADD TO QA, DELETE FROM UQA
	.delete(unansweredController.delete);           // DELETE FROM UQA

// Export API routes 
module.exports = router;