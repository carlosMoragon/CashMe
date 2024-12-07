const express = require('express');
const router = express.Router();
const db = require('sqlite3').verbose();

// Configuración de la base de datos
const database = new db.Database('../cashme');

router.get('/', function(req, res, next) {
    res.render('adminBlog', {user: req.session.user});
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


// Ruta para obtener todas las entradas de blog
router.get('/get-entries', (req, res) => {
    const query = `SELECT id, titulo, resumen, contenido, fecha_publicacion FROM entradas_blog`;

    database.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching entries:', err);
            return res.status(500).json({ error: 'Failed to fetch entries.' });
        }

        res.json(rows);
    });
});


// Ruta para obtener una entrada de blog por ID
router.get('/get-entry/:id', (req, res) => {
    const { id } = req.params;

    const query = `SELECT id, titulo, resumen, contenido, fecha_publicacion FROM entradas_blog WHERE id = ?`;

    database.get(query, [id], (err, row) => {
        if (err) {
            console.error('Error fetching blog entry:', err);
            return res.status(500).json({ error: 'Failed to fetch blog entry.' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Entry not found.' });
        }

        res.json(row);
    });
});




router.put('/edit-entry/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, resumen, contenido } = req.body;

    // Verificar que los campos obligatorios estén presentes
    if (!titulo || !resumen || !contenido) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const query = `
        UPDATE entradas_blog
        SET titulo = ?, resumen = ?, contenido = ?
        WHERE id = ?
    `;

    database.run(query, [titulo, resumen, contenido, id], function (err) {
        if (err) {
            console.error('Error editing entry:', err);
            return res.status(500).json({ error: 'Failed to edit entry.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Entry not found.' });
        }

        res.json({ success: true, message: 'Entry updated successfully!' });
    });
});



router.delete('/delete-entry/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM entradas_blog WHERE id = ?`;

    database.run(query, [id], function (err) {
        if (err) {
            console.error('Error deleting entry:', err);
            return res.status(500).json({ error: 'Failed to delete entry.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Entry not found.' });
        }

        res.json({ success: true, message: 'Entry deleted successfully!' });
    });
});


module.exports = router;
