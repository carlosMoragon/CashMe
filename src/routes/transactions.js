const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// CONEXIÓN
const db = new sqlite3.Database('../cashme', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos SQLite');
    }
});

// OBETENER TODAS LAS TRANSACCIONES
router.get('/', (req, res) => {
    const user = req.session.user;
    db.all('SELECT * FROM transacciones', [], (err, rows) => {
        if (err) {
            console.error('Error al obtener transacciones:', err.message);
            res.status(500).send('Error en el servidor');
        } else {
            res.render('transactions', { transactions: rows, user });
        }
    });
});


// AÑADIR UNA TRANSACCIÓN
router.post('/add', (req, res) => {
    const { tipo, dinero, descripcion, fecha } = req.body;
    db.run(
        'INSERT INTO transacciones (tipo, dinero, descripcion, fecha) VALUES (?, ?, ?, ?)',
        [tipo, dinero, descripcion, fecha],
        (err) => {
            if (err) {
                console.error('Error al insertar transacción:', err.message);
                res.status(500).send('Error en el servidor');
            } else {
                res.redirect('/transactions');
            }
        }
    );
});


// ELIMINAR 
router.post('/delete/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM transacciones WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error al eliminar transacción:', err.message);
            res.status(500).send('Error en el servidor');
        } else {
            res.redirect('/transactions');
        }
    });
});

module.exports = router;
