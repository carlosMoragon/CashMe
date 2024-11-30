// routes/adminGarden.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../cashme');

router.get('/', function (req, res, next) {
    db.all("SELECT id, planta, evolucion FROM jardines", function (err, rows) {
    // db.all("SELECT id, planta FROM jardin", function (err, rows) {
        if (err) {
            return next(err);
        }
        // console.log(rows);
        res.render('adminGarden', { plants: rows });
    });
});

module.exports = router;

