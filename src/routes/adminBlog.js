const express = require('express');
const router = express.Router();
const db = require('sqlite3').verbose();

// Configuración de la base de datos
const database = new db.Database('../cashme');


router.post('/add-entry', (req, res) => {
    const { titulo, resumen, contenido, fecha_publicacion } = req.body;

    if (!titulo || !resumen || !contenido || !fecha_publicacion) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const query = `
        INSERT INTO entradas_blog (titulo, resumen, contenido, fecha_publicacion)
        VALUES (?, ?, ?, ?)
    `;
    database.run(query, [titulo, resumen, contenido, fecha_publicacion], function (err) {
        if (err) {
            console.error('Error adding entry:', err);
            return res.status(500).json({ error: 'Failed to add entry.' });
        }

        res.json({ success: true, message: 'Entry added successfully!', entryId: this.lastID });
    });
});


module.exports = router;
