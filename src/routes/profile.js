//profile.js
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {   
    res.render('profile', { email: req.session.nombre});
  });

module.exports = router;