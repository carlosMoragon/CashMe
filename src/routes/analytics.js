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

// GET analytics page
router.get('/', function(req, res, next) {
  res.render('analytics', { user: req.session.user });
});

router.get('/data/ingresos', (req, res) => {
    const query = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'INGRESO' AND fecha >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY strftime('%Y-%m', fecha)
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const labels = [];
        const data = [];
        const currentDate = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const month = date.toISOString().slice(0, 7);
            labels.push(month);
            const row = rows.find(row => row.month === month);
            data.push(row ? row.total : 0);
        }
        res.json({ labels, data });
    });
});

router.get('/data/gastos', (req, res) => {
    // Placeholder data
    res.json({
        labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        data: [900, 1100, 700, 1300, 1600, 1400, 1900, 2000, 1700, 1900, 2100, 2300]
    });
});

router.get('/data/neto', (req, res) => {
    // Placeholder data
    res.json({
        labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        data: [300, 400, 100, 400, 400, 400, 300, 400, 400, 400, 400, 400]
    });
});

module.exports = router;