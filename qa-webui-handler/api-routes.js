// Dependencies
let router = require('express').Router();
var qaController = require('./qaController');

// Default API response 
router.get('/', (req, res) => {
	res.json({
		status: 'API working',
		message: 'Welcome to my world'
	});
});

// Table routes 
router.route('/qa-stream-table')
	.get(qaController.index)
	.post(qaController.new);

// Intent routes 
router.route('/qa-stream-table/:intent')
	.get(qaController.view)
	.put(qaController.update)
	.delete(qaController.delete);

// Export API routes 
module.exports = router;