
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('analytics', { page: 'analytics' });
});

module.exports = router;