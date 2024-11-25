var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('aboutus', { email: req.session.email });
});

module.exports = router;