// routes/adminHome.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../cashme');

router.get('/', function (req, res) {
    db.all('SELECT nombre, email, photo_path, id, activo  FROM usuarios', (err, rows) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            res.status(500).send('Error al cargar los usuarios.');
            return;
        }
        res.render('adminHome', { usuarios: rows });
    });
});


router.get('/get-transacciones', function (req, res) {
    db.all('SELECT fecha, tipo, COUNT(*) AS cantidad FROM transacciones WHERE fecha >= DATE("now", "-30 days") GROUP BY fecha, tipo ORDER BY fecha DESC', (err, transaccionesData) => {
        if (err) {
            console.error('Error al obtener las transacciones:', err.message);
            return res.status(500).send('Error en el servidor');
        }

        const fechasArray = [];
        const ingresosArray = [];
        const gastosArray = [];

        transaccionesData.forEach(transaccion => {
            fechasArray.push(transaccion.fecha);
            if (transaccion.tipo === 'INGRESO') {
                ingresosArray.push(transaccion.cantidad);
                gastosArray.push(0);
            } else if (transaccion.tipo === 'GASTO') {
                ingresosArray.push(0);
                gastosArray.push(transaccion.cantidad);
            }
        });

        console.log("transacciones de mierda:", transaccionesData);
        
        res.json({ fechas: fechasArray, ingresos: ingresosArray, gastos: gastosArray });
    });
});


router.delete('/delete-user/:id', (req, res) => {
    const userId = req.params.id; 
    console.log('Received User ID:', userId); // Verifica que se esté recibiendo el ID

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required to delete a user.' });
    }

    db.run('DELETE FROM usuarios WHERE id = ?', [userId], function (err) {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ error: 'An error occurred while deleting the user.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'The user was not found.' });
        }

        console.log(`User with ID ${userId} deleted successfully.`);
        return res.status(200).json({ message: 'User deleted successfully.' });
    });
});


router.post('/block-active-user/:id', (req, res) => {
    const userId = req.params.id; 

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required to delete a user.' });
    }

    db.get('SELECT activo FROM usuarios WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error('Error fetching user status:', err);
            return res.status(500).json({ error: 'An error occurred while fetching the user status.' });
        }

        if (!row) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Cambiar el estado: Si está activo (1), se bloquea (0); si está bloqueado (0), se activa (1)
        const newStatus = row.activo === 1 ? 0 : 1;

        db.run('UPDATE usuarios SET activo = ? WHERE id = ?', [newStatus, userId], function (err) {
            if (err) {
                console.error('Error updating user status:', err);
                return res.status(500).json({ error: 'An error occurred while updating the user status.' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'The user was not found.' });
            }

            console.log(`User with ID ${userId} updated to status ${newStatus}.`);
            return res.status(200).json({message: 'User status updated successfully.'});
        });
    });
});





module.exports = router;