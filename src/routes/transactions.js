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

    // COmpruebo si ha logueado
    if (!user) {
        return res.redirect('/login');
    }

    // Consultas anidadas para primero obtener la cuenta del usuario y luego las transacciones de esa cuenta
    db.all('SELECT * FROM cuentas WHERE usuario_id = ?', [user.id], (err, cuentas) => {
        if (err) {
            console.error('Error al obtener cuentas:', err.message);
            return res.status(500).send('Error en el servidor');
        }

        db.all('SELECT * FROM transacciones WHERE id_cuenta = ?', [cuentas[0]?.id], (err, rows) => {
            if (err) {
                console.error('Error al obtener transacciones:', err.message);
                return res.status(500).send('Error en el servidor');
            }

            res.render('transactions', { transactions: rows, user, cuentas });
        });
    });
});


// AÑADIR UNA TRANSACCIÓN
router.post('/add', (req, res) => {
    const { tipo, dinero, descripcion, fecha, id_cuenta } = req.body;

    db.run(
        'INSERT INTO transacciones (tipo, dinero, descripcion, fecha, id_cuenta) VALUES (?, ?, ?, ?, ?)',
        [tipo, dinero, descripcion, fecha, id_cuenta],
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
