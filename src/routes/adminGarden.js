// routes/adminGarden.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('adminGarden', { });
});

module.exports = router;

