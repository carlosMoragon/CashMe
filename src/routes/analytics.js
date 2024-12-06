const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');


// CONEXIÓN
// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

// Example function to adjust month value


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
        console.log(rows); // Verifica qué datos se están obteniendo
        const labels = [];
        const data = [];
        const currentDate = new Date();
        // Iterative case: previous 12 months
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
    const query = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'GASTO' AND fecha >= date('now', '-12 months')
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

router.get('/data/neto', (req, res) => {
    const ingresosQuery = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'INGRESO' AND fecha >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY strftime('%Y-%m', fecha)
    `;
    const gastosQuery = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'GASTO' AND fecha >= date('now', '-12 months')
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
            for (let i = 11; i >= 0; i--) {
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

router.get('/data/combined', (req, res) => {
    const ingresosQuery = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'INGRESO' AND fecha >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY strftime('%Y-%m', fecha)
    `;
    const gastosQuery = `
        SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'GASTO' AND fecha >= date('now', '-12 months')
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
            const ingresos = [];
            const gastos = [];
            const currentDate = new Date();
            // Iterative case: previous 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const month = date.toISOString().slice(0, 7);
                labels.push(month);
                const ingresoRow = ingresosRows.find(row => row.month === month);
                const gastoRow = gastosRows.find(row => row.month === month);
                ingresos.push(ingresoRow ? ingresoRow.total : 0);
                gastos.push(gastoRow ? gastoRow.total : 0);
            }
            res.json({ labels, ingresos, gastos });
        });
    });
});

router.get('/income', async (req, res) => {
  try {
    let transactions = await getIncomeTransactionsFromDB(); // Fetch transactions from DB
    transactions = adjustTransactionMonth(transactions); // Adjust month
    res.json(transactions);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/expenses', async (req, res) => {
  try {
    let transactions = await getExpenseTransactionsFromDB(); // Fetch transactions from DB
    transactions = adjustTransactionMonth(transactions); // Adjust month
    res.json(transactions);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/data/total-ingresos', (req, res) => {
    const query = `
        SELECT SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'INGRESO' AND fecha >= date('now', '-12 months')
    `;
    db.get(query, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ total: row.total });
    });
});

router.get('/data/total-gastos', (req, res) => {
    const query = `
        SELECT SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'GASTO' AND fecha >= date('now', '-12 months')
    `;
    db.get(query, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ total: row.total });
    });
});

router.get('/data/total-neto', (req, res) => {
    const ingresosQuery = `
        SELECT SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'INGRESO' AND fecha >= date('now', '-12 months')
    `;
    const gastosQuery = `
        SELECT SUM(dinero) as total
        FROM transacciones
        WHERE tipo = 'GASTO' AND fecha >= date('now', '-12 months')
    `;
    db.get(ingresosQuery, [], (err, ingresosRow) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.get(gastosQuery, [], (err, gastosRow) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const totalNeto = ingresosRow.total - gastosRow.total;
            res.json({ total: totalNeto });
        });
    });
});

router.get('/export-pdf', async (req, res) => {
    try {
        const ingresosData = await getData('/data/ingresos');
        const gastosData = await getData('/data/gastos');

        const templatePath = path.join(__dirname, '../views/report_template.html');
        const template = fs.readFileSync(templatePath, 'utf8');
        const html = ejs.render(template, { ingresosData, gastosData });

        const pdf = new jsPDF();
        pdf.html(html, {
            callback: function (doc) {
                const pdfPath = path.join(__dirname, '../public/reporte_financiero.pdf');
                doc.save(pdfPath);
                res.download(pdfPath, 'reporte_financiero.pdf', (err) => {
                    if (err) {
                        res.status(500).send('Error al descargar el PDF');
                    } else {
                        fs.unlinkSync(pdfPath); // Delete the file after download
                    }
                });
            },
            x: 10,
            y: 10
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/export-html', async (req, res) => {
    try {
        const ingresosData = await getData('/data/ingresos');
        const gastosData = await getData('/data/gastos');

        const templatePath = path.join(__dirname, '../views/report_template.html');
        const template = fs.readFileSync(templatePath, 'utf8');
        const html = ejs.render(template, { ingresosData, gastosData });

        const htmlPath = path.join(__dirname, '../public/reporte_financiero.html');
        fs.writeFileSync(htmlPath, html);

        res.download(htmlPath, 'reporte_financiero.html', (err) => {
            if (err) {
                res.status(500).send('Error al descargar el HTML');
            } else {
                fs.unlinkSync(htmlPath); // Delete the file after download
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

async function getData(endpoint) {
    const response = await fetch(`http://localhost:3000/analytics${endpoint}`);
    return response.json();
}

module.exports = router;