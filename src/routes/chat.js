var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('chat', {});
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
  const name = req.session.user.nombre;
  const content = req.body.content_message;
  const chat = req.body.chat-header;

  console.log(`name: ${name}, content: ${content}, chat: ${chat}`);

  db.get("SELECT id FROM chats WHERE titulo = ?", [chat], function(err, row) {
    if (err) {
      return next(err);
    }

    if (row){
      db.run('INSERT INTO mensajes(fecha, contenido, emisor, chat_id) VALUES(?, ?, ?, ?)', [getTodayDate(), content, name, row.id], function(err){
        if(err){
          return next(err);
        }
      });
    } else {
      console.log("error en el insert")
    }
  });

});

module.exports = router;