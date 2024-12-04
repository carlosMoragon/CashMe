const express = require('express');
const router = express.Router();
const db = require('sqlite3').verbose();

// Configuración de la base de datos
const database = new db.Database('../cashme');

router.get('/', function(req, res, next) {
    res.render('adminBlog', {});
});

router.post('/add-entry', (req, res) => {
    const { titulo, resumen, contenido, fecha_publicacion } = req.body;

    // Verificar que todos los campos necesarios estén presentes
    if (!titulo || !resumen || !contenido || !fecha_publicacion) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Verificar que haya un usuario autenticado con un ID en la sesión
    if (!req.session.user.id) {
        return res.status(403).json({ error: 'Unauthorized: No user ID in session.' });
    }

    const autor_id = req.session.user.id;

    const query = `
        INSERT INTO entradas_blog (titulo, resumen, contenido, fecha_publicacion, autor_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    database.run(query, [titulo, resumen, contenido, fecha_publicacion, autor_id], function (err) {
        if (err) {
            console.error('Error adding entry:', err);
            return res.status(500).json({ error: 'Failed to add entry.' });
        }

        res.json({ success: true, message: 'Entry added successfully!', entryId: this.lastID });
    });
});

module.exports = router;