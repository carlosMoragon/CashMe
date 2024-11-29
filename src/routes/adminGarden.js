// routes/adminGarden.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../cashme');

router.get('/', function(req, res, next) {
    // Hacer la consulta a la base de datos
    // db.all('SELECT planta FROM jardin', (err, rows) => { //Hay otra cosa en la BBDD
    //     if (err) {
    //         console.error('Error al obtener las plantas registradas:', err);
    //         res.status(500).send('Error al cargar las plantas.');
    //         return;
    //     }

        // res.render('adminGarden', { planta: rows });
        res.render('adminGarden', { });

    });
//});

  
module.exports = router;

