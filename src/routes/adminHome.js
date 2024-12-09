// routes/adminHome.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../cashme');

router.get('/', function (req, res) {
    db.all('SELECT nombre, email, photo_path, id  FROM usuarios', (err, rows) => {
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




module.exports = router;