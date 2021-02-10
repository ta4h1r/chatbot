// Dependencies
let router = require('express').Router();
var controller = require('./controller');

// Default API response 
router.get('/', (req, res) => {
	console.log('Test GET hit');
	res.json({
		status: 'API working',
		message: 'Welcome to my world'
	});
});

// Table routes 
router.route('/qa-logs-table')
	.post(controller.index);
	
// Export API routes 
module.exports = router;