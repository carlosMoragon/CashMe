const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

router.get('/', (req, res) => {
  const query = `SELECT * FROM mensajes_contacto`;

  db.all(query, [], (err, rows) => {
      if (err) {
          console.error('Error retrieving messages:', err);
          return res.status(500).send('Error retrieving messages.');
      }

      // Renderizar la vista y pasar los mensajes
      res.render('adminContact', { messages: rows });
  });
});


// Ruta para eliminar un mensaje por ID
router.delete('/delete-message/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM mensajes_contacto WHERE id = ?`;

  db.run(query, [id], function (err) {
      if (err) {
          console.error('Error deleting the message:', err);
          return res.status(500).json({ error: 'Error deleting the message.' });
      }

      res.json({ success: true, message: 'Message deleted successfully.' });
  });
});

  


module.exports = router;
