var express = require('express');
var router = express.Router();

// GET analytics page
router.get('/', function(req, res, next) {
  res.render('analytics', { user: req.session.user });
});

module.exports = router;