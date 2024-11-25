const express = require('express');
const router = express.Router();
const db = require('sqlite3').verbose();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('contact', {  });
});


const database = new db.Database('../cashme');


router.post('/save-message', (req, res) => {
  const { nombre, correo, asunto, mensaje } = req.body;

  if (!nombre || !correo || !asunto || !mensaje) {
      return res.status(400).json({ error: 'All fields are required.' });
  }

  const query = `
      INSERT INTO mensajes_contacto (nombre, correo, asunto, mensaje)
      VALUES (?, ?, ?, ?)
  `;
  console.log("==> Query; ", query);

  database.run(query, [nombre, correo, asunto, mensaje], function (err) {
      if (err) {
          console.error('Error saving the message:', err);
          return res.status(500).json({ error: 'Error saving the message.' });
      }
      console.log("Se ha guardado el mensaje del cliente en la base de datos.");

      res.render('contact', { 
        success: 'Message sent successfully.' 
      });
      
  });
});





module.exports = router;