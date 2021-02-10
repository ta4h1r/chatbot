// Dependencies
let router = require('express').Router();
var controller = require('./controller');

// Default API response
router.get('/push-data', (req, res) => {
	res.json({
		status: 'API working',
		message: 'Welcome to my world'
	});
});

// Table routes
router.route('/push-data')
	.post(controller.getResponse);
router.route('/push-wiki-data')
	.post(controller.getWiki);

// Export API routes
module.exports = router;
