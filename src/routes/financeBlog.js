const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function(req, res, next) {
  // Consulta para obtener las entradas del blog con el nombre del autor
  const query = `
    SELECT eb.id, eb.titulo, eb.resumen, eb.fecha_publicacion, u.nombre AS autor
    FROM entradas_blog eb
    LEFT JOIN usuarios u ON eb.autor_id = u.id
    ORDER BY eb.fecha_publicacion DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener las entradas:', err);
      return next(err); // Pasar el error al manejador
    }

    // Renderizar la vista y pasarle los datos
    res.render('financeBlog', { entradas: rows });
  });
});

router.get('/entry/:id', function (req, res, next) {
  const id = req.params.id;
  const query = `
    SELECT eb.contenido, eb.fecha_publicacion, u.nombre AS autor
    FROM entradas_blog eb
    LEFT JOIN usuarios u ON eb.autor_id = u.id
    WHERE eb.id = ?
  `;

  db.get(query, [id], (err, row) => {
      if (err) {
          console.error('Error fetching entry content:', err);
          return next(err); // Pasar el error al manejador
      }

      if (row) {
          res.json({ 
              content: row.contenido,
              fecha_publicacion: row.fecha_publicacion,
              autor: row.autor
          });
      } else {
          const notFoundError = new Error('Entry not found.');
          notFoundError.status = 404;
          next(notFoundError); // Crear un error 404 si no se encuentra la entrada
      }
  });
});

module.exports = router;