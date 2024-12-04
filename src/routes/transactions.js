
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('transactions', { page: 'transactions' });
});

module.exports = router;