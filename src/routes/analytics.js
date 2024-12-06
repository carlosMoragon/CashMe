const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// CONEXIÓN
// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

// GET analytics page
router.get('/', function(req, res, next) {
  res.render('analytics', { user: req.session.user });
});

router.get('/data/ingresos', (req, res) => {
    const query = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'INGRESO' AND fecha >= date('now', 'start of month', '-12 months')
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
        // Iterative case: previous 12 months
        for (let i = 12; i > 0; i--) {
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
    const query = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'GASTO' AND fecha >= date('now', 'start of month', '-12 months')
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
        // Iterative case: previous 12 months
        for (let i = 12; i > 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const month = date.toISOString().slice(0, 7);
            labels.push(month);
            const row = rows.find(row => row.month === month);
            data.push(row ? row.total : 0);
        }
        res.json({ labels, data });
    });
});

router.get('/data/neto', (req, res) => {
    const ingresosQuery = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'INGRESO' AND fecha >= date('now', 'start of month', '-12 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY strftime('%Y-%m', fecha)
    `;
    const gastosQuery = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'GASTO' AND fecha >= date('now', 'start of month', '-12 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY strftime('%Y-%m', fecha)
    `;
    db.all(ingresosQuery, [], (err, ingresosRows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.all(gastosQuery, [], (err, gastosRows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const labels = [];
            const data = [];
            const currentDate = new Date();
            // Iterative case: previous 12 months
            for (let i = 12; i > 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const month = date.toISOString().slice(0, 7);
                labels.push(month);
                const ingresoRow = ingresosRows.find(row => row.month === month);
                const gastoRow = gastosRows.find(row => row.month === month);
                const ingreso = ingresoRow ? ingresoRow.total : 0;
                const gasto = gastoRow ? gastoRow.total : 0;
                data.push(ingreso - gasto);
            }
            res.json({ labels, data });
        });
    });
});

module.exports = router;