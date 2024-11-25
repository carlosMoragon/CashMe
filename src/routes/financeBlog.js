var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function(req, res, next) {
  // Consulta para obtener las entradas del blog
  const query = `
    SELECT id, titulo, resumen, autor, fecha_publicacion, url_imagen 
    FROM entradas_blog 
    WHERE publicado = 1 
    ORDER BY fecha_publicacion DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener las entradas:', err);
      return res.status(500).send('Error al cargar las entradas del blog.');
    }

    // Renderizar la vista y pasarle los datos
    res.render('financeBlog', { entradas: rows });
  });
});


router.get('/entry/:id', function (req, res) {
  const id = req.params.id;
  const query = 'SELECT contenido FROM entradas_blog WHERE id = ?';

  db.get(query, [id], (err, row) => {
      if (err) {
          console.error('Error fetching entry content:', err);
          return res.status(500).json({ error: 'Failed to load content.' });
      }

      if (row) {
          res.json({ content: row.contenido });
      } else {
          res.status(404).json({ error: 'Entry not found.' });
      }
  });
});



module.exports = router;
