// Dependencies
let router = require('express').Router();
var streamHandler = require('./streamHandler');

// Default API response 
router.get('/', (req, res) => {
	res.json({
		status: 'API working',
		message: 'Welcome to my world'
	});
});

// Table routes 
router.route('/')
	.delete(streamHandler.getIntent);

// Export API routes 
module.exports = router;