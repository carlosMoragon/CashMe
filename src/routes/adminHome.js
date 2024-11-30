// routes/adminHome.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../cashme');
 
router.get('/', function(req, res, next) {
    // Hacer la consulta a la base de datos
    db.all('SELECT nombre, email FROM usuarios', (err, rows) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            res.status(500).send('Error al cargar los usuarios.');
            return;
        }
        // Pasar los datos de usuarios a la vista
        res.render('adminHome', { usuarios: rows });
    });
});
module.exports = router;