var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function(req, res, next) {
  const usuario = req.session.user ? req.session.user.nombre : null;

  // Si no hay usuario en la sesión, redirige o maneja el error
  if (!usuario) {
    return res.status(401).send('No se encontró al usuario en la sesión.');
  }

  db.all(`
    SELECT 
      chats.id AS chat_id, 
      chats.titulo AS chat_title, 
      mensajes.contenido AS last_message_content,
      mensajes.fecha AS last_message_date
    FROM usuarios
    INNER JOIN usuarios_chats ON usuarios.id = usuarios_chats.usuario_id
    INNER JOIN chats ON usuarios_chats.chat_id = chats.id
    LEFT JOIN mensajes ON chats.id = mensajes.chat_id
    WHERE usuarios.nombre = ?
    ORDER BY mensajes.fecha DESC
    LIMIT 1`, [usuario], function(err, rows) {
      if (err) {
        console.error("Error al realizar la consulta:", err);
        return next(err);
      }

      if (rows && rows.length > 0) {
        // Renderiza la vista 'chat', pasando solo los chats con su último mensaje
        res.render('chat', { chats: rows });
      } else {
        // Si no hay chats, pasa un mensaje vacío o nulo
        res.render('chat', { chats: [], message: 'No se encontraron chats para este usuario.' });
      }
  });

});




function getTodayDate(){
  const fecha = new Date();

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0'); // Mes (0-11) -> (1-12)
  const day = String(fecha.getDate()).padStart(2, '0');
  const hours = String(fecha.getHours()).padStart(2, '0');
  const minutes = String(fecha.getMinutes()).padStart(2, '0');

  // Formatear como YYYY-MM-DD HH:mm
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

router.post('/sendMessage', function(req, res, next) {
  console.log("Entra en SendMessage");
  
  if (!req.session || !req.session.user) {
    console.error("Sesión no inicializada.");
    return res.status(401).send("Usuario no autenticado.");
  }

  const name = req.session.user.nombre;
  const content = req.body.content_message;
  const chat = req.body.chat_header;
  const date = req.body.date;
                      
  console.log(`name: ${name}, content: ${content}, chat: ${chat}`);

  db.get("SELECT id FROM chats WHERE titulo = ?", [chat], function(err, row) {
    if (err) {
      console.error("Error en SELECT:", err);
      return next(err);
    }

    if (row) {
      console.log("Chat encontrado:", row);
      db.run('INSERT INTO mensajes(fecha, contenido, emisor, chat_id) VALUES(?, ?, ?, ?)',
        [getTodayDate(), content, name, row.id],
        function(err) {
          if (err) {
            console.error("Error en INSERT:", err);
            return next(err);
          }
          console.log("Mensaje insertado correctamente.");
          res.status(200).json({ message: "Mensaje enviado." });
        }
      );
    } else {
      console.error("Chat no encontrado.");
      //res.status(404).send("Chat no encontrado.");
      res.status(404).json({ message: "Chat no encontrado." });
    }
  });
});



module.exports = router;