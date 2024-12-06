var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', async function(req, res, next) {
  const usuario = req.session.user ? req.session.user.nombre : null;

  // Si no hay usuario en la sesión, redirige o maneja el error
  if (!usuario) {
    return res.status(401).send('No se encontró al usuario en la sesión.');
  }

  try {
    // Consulta para obtener los chats del usuario
    const chatsQuery = `
      SELECT 
          chats.id AS chat_id, 
          chats.titulo AS chat_title, 
          last_message.content AS last_message_content,
          last_message.date AS last_message_date
      FROM 
          usuarios
      INNER JOIN usuarios_chats ON usuarios.id = usuarios_chats.usuario_id
      INNER JOIN chats ON usuarios_chats.chat_id = chats.id
      LEFT JOIN (
          SELECT 
              chat_id, 
              contenido AS content, 
              fecha AS date
          FROM mensajes
          WHERE (chat_id, fecha) IN (
              SELECT chat_id, MAX(fecha)
              FROM mensajes
              GROUP BY chat_id
          )
      ) AS last_message ON chats.id = last_message.chat_id
      WHERE usuarios.nombre = ?
      ORDER BY last_message.date DESC;
      `;

    const chats = await queryDatabase(chatsQuery, [usuario]);

    // Obtener la lista de usuarios
    const usuarios = await getUsersName(req);

    // Renderiza la vista 'chat', pasando los datos
    res.render('chat', { chats, usuario: req.session.user.nombre, usuarios , user: req.session.user});
  } catch (err) {
    console.error("Error al realizar la consulta:", err);
    return next(err);
  }
});

// Función para obtener los usuarios, excluyendo al usuario actual
function getUsersName(req) {
  return new Promise((resolve, reject) => {
    const query = `SELECT nombre FROM usuarios WHERE nombre <> ?`;
    db.all(query, [req.session.user.nombre], (err, rows) => {
      if (err) {
        reject("Error al realizar la consulta para obtener usuarios.");
      } else {
        resolve(rows.map(row => row.nombre));
      }
    });
  });
}

// Función para hacer consultas a la base de datos
function queryDatabase(query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject("Error al ejecutar la consulta.");
      } else {
        resolve(rows);
      }
    });
  });
}



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

router.post('/deleteChat', function(req, res, next){
  // Verificar si el usuario está autenticado
  if (!req.session || !req.session.user) {
    console.error("Sesión no inicializada.");
    return res.status(401).send("Usuario no autenticado.");
  }

  const chat = req.body.chatName; // Nombre del chat a eliminar
  const usuario = req.session.user.nombre; // Nombre del usuario autenticado

  // Paso 1: Obtener el ID del chat a partir de su nombre
  db.get(
    'SELECT id FROM chats WHERE titulo = ?',
    [chat],
    function(err, row) {
      if (err) {
        console.error("Error al buscar el chat:", err);
        return next(err);
      }

      if (!row) {
        return res.status(404).json({ error: 'Chat no encontrado.' });
      }

      const chatId = row.id;

      // Paso 2: Verificar si el usuario está en ese chat
      db.get(
        'SELECT * FROM usuarios_chats WHERE chat_id = ? AND usuario_id = (SELECT id FROM usuarios WHERE nombre = ?)',
        [chatId, usuario],
        function(err, row) {
          if (err) {
            console.error("Error al verificar usuario en chat:", err);
            return next(err);
          }

          if (!row) {
            return res.status(403).json({ error: 'El usuario no pertenece a este chat.' });
          }

          // Paso 3: Borrar todos los mensajes del chat
          db.run(
            'DELETE FROM mensajes WHERE chat_id = ?',
            [chatId],
            function(err) {
              if (err) {
                console.error("Error al borrar los mensajes:", err);
                return next(err);
              }

              // Paso 4: Borrar las asociaciones en la tabla usuarios_chats
              db.run(
                'DELETE FROM usuarios_chats WHERE chat_id = ?',
                [chatId],
                function(err) {
                  if (err) {
                    console.error("Error al borrar la asociación usuario-chat:", err);
                    return next(err);
                  }

                  // Paso 5: Eliminar el chat de la tabla chats
                  db.run(
                    'DELETE FROM chats WHERE id = ?',
                    [chatId],
                    function(err) {
                      if (err) {
                        console.error("Error al borrar el chat:", err);
                        return next(err);
                      }

                      console.log("Chat eliminado correctamente.");
                      return res.status(200).json({ message: 'Chat eliminado exitosamente.' });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});


router.post('/createChat', function (req, res, next) {
  console.log("SE EJECUTA");
  // Verificar si el usuario está autenticado
  if (!req.session || !req.session.user) {
    console.error("Sesión no inicializada.");
    return res.status(401).send("Usuario no autenticado.");
  }

  // Obtener los datos del cuerpo de la solicitud
  const usuarios = req.body.usuarios; // Lista de nombres de usuarios
  const titulo = req.body.titulo;
  const fechaCreacion = req.body.date; // Usar fecha actual si no se proporciona

  // Validar entrada
  if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un usuario.' });
  }
  if (!titulo) {
    return res.status(400).json({ error: 'Debe proporcionar un título para el chat.' });
  }

  // Paso 1: Insertar el chat en la tabla "chats"
  db.run(
    'INSERT INTO chats (titulo, fecha) VALUES (?, ?)',
    [titulo, fechaCreacion],
    function (err) {
      if (err) {
        console.error('Error al crear el chat:', err);
        return next(err);
      }

      const chatId = this.lastID; // Obtener el ID del chat recién creado
      console.log('Chat creado correctamente con ID:', chatId);

      // Paso 2: Obtener los IDs de los usuarios a partir de sus nombres
      const placeholders = usuarios.map(() => '?').join(', ');
      db.all(
        `SELECT id FROM usuarios WHERE nombre IN (${placeholders})`,
        usuarios,
        function (err, rows) {
          if (err) {
            console.error('Error al buscar usuarios:', err);
            return next(err);
          }

          if (rows.length !== usuarios.length) {
            console.error('Algunos usuarios no se encontraron.');
            return res.status(400).json({
              error: 'Algunos usuarios no existen en la base de datos.',
            });
          }

          const usuariosIds = rows.map((row) => row.id);

          // Paso 3: Asociar usuarios al chat en la tabla "usuarios_chats"
          const placeholdersChats = usuariosIds.map(() => '(?, ?)').join(', ');
          const valuesChats = usuariosIds.flatMap((usuarioId) => [usuarioId, chatId]);

          db.run(
            `INSERT INTO usuarios_chats (usuario_id, chat_id) VALUES ${placeholdersChats}`,
            valuesChats,
            function (err) {
              if (err) {
                console.error('Error al asociar usuarios al chat:', err);
                return next(err);
              }

              console.log('Usuarios asociados correctamente al chat.');
              res.status(200).json({
                message: 'Chat creado exitosamente.',
                chatId,
              });
            }
          );
        }
      );
    }
  );
});

/*
router.post('/createChat', function (req, res, next) {
  console.log("SE EJECUTA");

  if (!req.session || !req.session.user) {
    console.error("Sesión no inicializada.");
    return res.status(401).json({ error: "Usuario no autenticado." });
  }

  const usuarios = req.body.usuarios; // Lista de nombres de usuarios
  const titulo = req.body.titulo;
  const fechaCreacion = req.body.date || new Date().toISOString(); // Usar la fecha actual si no se proporciona

  usuarios.array.forEach(element => {
    console.log(`AAAAAAAAAAAAAAAAAAAAAAAAAAAAA ${element}\n\n\n`);
  });
  // Validar entrada
  if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
    return res.status(400).json({ error: "Debe proporcionar al menos un usuario." });
  }
  if (!titulo) {
    return res.status(400).json({ error: "Debe proporcionar un título para el chat." });
  }

  // Paso 1: Insertar el chat en la tabla `chats`
  db.run(
    'INSERT INTO chats (titulo, fecha) VALUES (?, ?)',
    [titulo, fechaCreacion],
    function (err) {
      if (err) {
        console.error("Error al crear el chat:", err);
        return next(err);
      }

      const chatId = this.lastID; // Obtener el ID del chat recién creado
      console.log("Chat creado correctamente con ID:", chatId);

      // Paso 2: Obtener los IDs de los usuarios basándose en los nombres
      const placeholders = usuarios.map(() => '?').join(', ');
      db.all(
        `SELECT id FROM usuarios WHERE nombre IN (${placeholders})`,
        usuarios,
        function (err, rows) {
          if (err) {
            console.error("Error al buscar usuarios:", err);
            return next(err);
          }

          if (rows.length !== usuarios.length) {
            console.error("Algunos usuarios no se encontraron.");
            return res.status(400).json({
              error: "Algunos usuarios no existen en la base de datos.",
            });
          }

          const usuariosIds = rows.map((row) => row.id);

          // Paso 3: Asociar usuarios al chat en la tabla `usuarios_chats`
          const placeholdersChats = usuariosIds.map(() => '(?, ?)').join(', ');
          const valuesChats = usuariosIds.flatMap((usuarioId) => [usuarioId, chatId]);

          db.run(
            `INSERT INTO usuarios_chats (usuario_id, chat_id) VALUES ${placeholdersChats}`,
            valuesChats,
            function (err) {
              if (err) {
                console.error("Error al asociar usuarios al chat:", err);
                return next(err);
              }

              console.log("Usuarios asociados correctamente al chat.");
              res.status(200).json({
                message: "Chat creado exitosamente.",
                chatId,
              });
            }
          );
        }
      );
    }
  );
});


*/

// metí esto a ver si funcioa conectar desde el admin (Orianna)
// Ruta para crear un chat entre el usuario conectado y el seleccionado
// router.get('/chat/createChat', function (req, res, next) {
//   const usuarioEmail = req.query.usuario; // El email del usuario seleccionado
//   const currentUser = req.session.user; // Suponiendo que el usuario conectado está en la sesión

//   // Verificar si el usuario está autenticado
//   if (!currentUser) {
//     return res.status(401).send('Usuario no autenticado');
//   }

//   // Paso 1: Obtener los IDs de los dos usuarios (el actual y el seleccionado)
//   db.all('SELECT id, email FROM usuarios WHERE email IN (?, ?)', [currentUser.email, usuarioEmail], function (err, rows) {
//     if (err) {
//       console.error('Error al obtener los usuarios:', err);
//       return next(err);
//     }

//     if (rows.length !== 2) {
//       return res.status(404).send('No se encontraron ambos usuarios');
//     }

//     const usuarioIds = rows.map(row => row.id);

//     // Paso 2: Comprobar si ya existe un chat entre ellos
//     db.get('SELECT c.id FROM chats c JOIN usuarios_chats uc ON c.id = uc.chat_id WHERE uc.usuario_id IN (?, ?) GROUP BY c.id', usuarioIds, function (err, chatRow) {
//       if (err) {
//         console.error('Error al buscar chat existente:', err);
//         return next(err);
//       }

//       if (chatRow) {
//         // Si ya existe un chat, redirigir al chat existente
//         return res.redirect(`/chat/${chatRow.id}`);
//       }

//       // Paso 3: Si no existe, crear un nuevo chat
//       const titulo = `Chat entre ${currentUser.email} y ${usuarioEmail}`;
//       const fechaCreacion = new Date().toISOString();

//       db.run('INSERT INTO chats (titulo, fecha) VALUES (?, ?)', [titulo, fechaCreacion], function (err) {
//         if (err) {
//           console.error('Error al crear el chat:', err);
//           return next(err);
//         }

//         const chatId = this.lastID;

//         // Paso 4: Asociar ambos usuarios con el nuevo chat
//         const valores = [usuarioIds[0], chatId, usuarioIds[1], chatId];
//         db.run('INSERT INTO usuarios_chats (usuario_id, chat_id) VALUES (?, ?), (?, ?)', valores, function (err) {
//           if (err) {
//             console.error('Error al asociar usuarios al chat:', err);
//             return next(err);
//           }

//           // Redirigir a la vista del chat recién creado
//           res.redirect(`/chat/${chatId}`);
//         });
//       });
//     });
//   });
// });


//

router.post('/getMessages', function(req, res, next) {
  console.log("Entra en SendMessage");
  
  // Verificación de sesión
  if (!req.session || !req.session.user) {
    console.error("Sesión no inicializada.");
    return res.status(401).send("Usuario no autenticado.");
  }

  const name = req.session.user.nombre; // Nombre del usuario autenticado
  const chat = req.body.chat_header;   // Título del chat

  // Consulta SQL utilizando db.all para obtener múltiples filas
  db.all(`
    SELECT mensajes.id, mensajes.contenido, mensajes.emisor, mensajes.fecha
    FROM usuarios
    JOIN usuarios_chats ON usuarios.id = usuarios_chats.usuario_id
    JOIN chats ON usuarios_chats.chat_id = chats.id
    JOIN mensajes ON chats.id = mensajes.chat_id
    WHERE usuarios.nombre = ?
    AND chats.titulo = ?`, [name, chat], function(err, rows) {
    if (err) {
      console.error("Error en SELECT:", err);
      return next(err);
    }

    if (rows && rows.length > 0) {
      console.log("Mensajes recuperados:", rows);
      return res.json(rows); // Enviar los mensajes como respuesta JSON
    } else {
      console.log("No se encontraron mensajes.");
      return res.json([]); // Respuesta vacía si no hay mensajes
    }
  });
});

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