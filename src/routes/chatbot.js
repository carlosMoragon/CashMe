const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { body, validationResult } = require('express-validator');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();
const db = new sqlite3.Database('../cashme');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
});

router.use(limiter);

const csrfProtection = csrf({ cookie: true });

router.get('/', csrfProtection, (req, res) => {
    const user = req.session.user;

    if (!user) {
        return res.redirect('/login');
    }

    res.render('chatbot', { 
        user: req.session.user, 
        messages: [],
        csrfToken: req.csrfToken(),
    });
});

router.post('/send', csrfProtection, [
    body('message')
        .trim()
        .notEmpty().withMessage('El mensaje no puede estar vacío.')
        .isLength({ max: 200 }).withMessage('El mensaje no puede exceder los 200 caracteres.')
        .escape(),], async (req, res) => {

    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'No autenticado.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    db.all('SELECT id FROM cuentas WHERE usuario_id = ?', [req.session.user.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const accountIds = rows.map(row => row.id);
        const ingresosQuery = `
            SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
            FROM transacciones
            WHERE tipo = 'INGRESO' AND fecha >= date('now', '-12 months') AND id_cuenta IN (${accountIds.join(',')})
            GROUP BY strftime('%Y-%m', fecha)
            ORDER BY strftime('%Y-%m', fecha)
        `;
        const gastosQuery = `
            SELECT strftime('%Y-%m', fecha) as month, SUM(dinero) as total
            FROM transacciones
            WHERE tipo = 'GASTO' AND fecha >= date('now', '-12 months') AND id_cuenta IN (${accountIds.join(',')})
            GROUP BY strftime('%Y-%m', fecha)
            ORDER BY strftime('%Y-%m', fecha)
        `;
        db.all(ingresosQuery, [], (err, ingresosRows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            db.all(gastosQuery, [], async (err, gastosRows) => {
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

                const financialSummary = labels.map((label, index) => {
                    return `${label}: ${data[index]}`;
                }).join('\n');

                try {
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                    if (!model) {
                        logger.error('Modelo generativo no encontrado.');
                        return res.status(500).json({ error: 'Modelo generativo no disponible.' });
                    }

                    const prompt = `Eres un analista financiero y un usuario te ha pedido ayuda con una consulta acerca de sus finanzas personales básicas (gastos, ingresos y beneficio neto). Proporciona una respuesta clara y concisa a la siguiente consulta del usuario, evitando extenderte demasiado. Si es necesario, invita al usuario a hacer preguntas adicionales para mayor claridad. Consulta del usuario: "${message}"\n\nResumen financiero de los últimos 12 meses:\n${financialSummary}`;

                    const result = await model.generateContent([prompt]);

                    res.json({ reply: result.response.text() });
                } catch (error) {
                    logger.error('Error al usar Google Gemini:', error);
                    res.status(500).json({ error: 'Hubo un problema al generar la respuesta.' });
                }
            });
        });
    });
});

module.exports = router;