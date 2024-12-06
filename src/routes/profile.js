//profile.js
var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();


const db = new sqlite3.Database('../cashme');


/* GET home page. */
router.get('/', (req, res) => {
  const user = req.session.user;
  console.log(user);

  // Obtener saldo del usuario
  db.get('SELECT saldo, goal FROM cuentas WHERE usuario_id = ?', [user.id], (err, cash) => {
    if (err) {
      console.error('Error al obtener el saldo del usuario:', err);
      res.status(500).send('Error al cargar los datos.');
      return;
    }

    // Obtener las plantas disponibles
    db.all("SELECT id, planta, evolucion FROM jardines", (err, plantsAvailable) => {
      if (err) {
        console.error('Error al obtener las plantas disponibles:', err);
        res.status(500).send('Error al cargar las plantas disponibles.');
        return;
      }

      // Inicializar variables para el renderizado
      let error = null;
      let awarded = 0; // Valor predeterminado para saldoAcumulado si no existe saldo
      let goalGoal = 0; 
      // Verificar si existe el saldo
      if (!cash) {
        console.error('No se encontró saldo para el usuario.');
        error = 'Saldo no encontrado';
      } else {
        console.log('Saldo del usuario:', cash.saldo);
        awarded = cash.saldo * 0.45;
        console.log('Meta del usuario:', cash.goal);
        if (cash.goal != null) {
          goalGoal = cash.goal;
          console.log('Meta del usuario:', goalGoal);
        }
      }


      // Renderizar la página de perfil
      res.render('profile', {
        email: user.email,
        username: user.nombre,
        saldoAcumulado: awarded,
        goalSet: goalGoal, 
        plantasDisponibles: plantsAvailable,
        error: error,
        user: req.session.user
      });
    });
  });
});


// Cuentas (AJAX)
router.get('/getAccounts', function (req, res) {
    const userId = req.session.user.id;

  db.all('SELECT id, saldo, notificaciones, goal FROM cuentas WHERE usuario_id = ?', [userId], (err, accounts) => {
    if (err) {
      console.error('Error al obtener las cuentas:', err);
      return res.status(500).send({ error: 'Error al cargar las cuentas.' });
    }

    res.send({ accounts });
  });
});

//Setting a challenge/goal
router.post('/saveChallenge', function (req, res) {
  try {
    const amount = req.body.amount;
    const userId = req.session.user.id;
    // console.log('amount:', amount);
    // console.log('userId:', userId);

    const selectSql = "SELECT goal FROM cuentas WHERE usuario_id = ?";
    db.get(selectSql, [userId], function (err, row) {
      if (!row) {
        try {
          const insertSql = "INSERT INTO cuentas (usuario_id, saldo, goal) VALUES (?, ?, ?)";
          db.run(insertSql, [userId, 0.0, amount], function (err) {
            if (err) {
              console.error(err.message);
            } else {
              console.log(`Nueva fila insertada con el ID ${userId}`);
            }
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error inserting the challenge.' });
        }
      } else {
        let updatedGoal = parseFloat(row.goal) + parseFloat(amount);
        const updateSql = "UPDATE cuentas SET goal = ? WHERE usuario_id = ?";
        db.run(updateSql, [updatedGoal, userId], function (err) {
          if (err) {
            console.error(err.message);
          } else {
            console.log(`Fila actualizada con el ID ${userId}`);
            res.redirect('/profile');
          }
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing the form.' });
  }
});

// Función para comprar una planta
// router.post('/comprarPlanta', (req, res) => {
//   try {
//     const user = req.session.user; // Obtener datos del usuario de la sesión
//     const { plantId } = req.body; // ID de la planta seleccionada
//     if (!user || !plantId) {
//       return res.status(400).json({ error: 'Datos incompletos' });
//     }

//     // Obtener saldo del usuario
//     db.get('SELECT saldo FROM cuentas WHERE usuario_id = ?', [user.id], (err, cash) => {
//       if (err) {
//         console.error('Error al obtener el saldo del usuario:', err);
//         return res.status(500).json({ error: 'Error al procesar la compra.' });
//       }

//       // Obtener precio de la planta
//       db.get('SELECT evolucion FROM jardines WHERE id = ?', [plantId], (err, plant) => {
//         const plantPrice = plant.evolucion;
        
//         // Validar si el usuario tiene saldo suficiente
//         if (cash.saldo < plantPrice) {
//           return res.status(400).json({ error: 'Saldo insuficiente para comprar esta planta.' });
//         }

//         // Actualizar saldo del usuario en la base de datos
//         const newSaldo = cash.saldo - plantPrice;
//         db.run(
//           'UPDATE cuentas SET saldo = ? WHERE usuario_id = ?',
//           [newSaldo, user.id],
//           function (err) {
//             if (err) {
//               console.error('Error al actualizar el saldo del usuario:', err);
//               return res.status(500).json({ error: 'Error al actualizar el saldo.' });
//             }

//             // Insertar la planta comprada en la tabla de jardines
//             db.run(
//               'INSERT INTO jardines (usuario_id, planta_id) VALUES (?, ?)',
//               [user.id, plantId],
//               function (err) {
//                 if (err) {
//                   console.error('Error al añadir la planta al jardín:', err);
//                   return res.status(500).json({ error: 'Error al registrar la compra.' });
//                 }

//                 console.log(`Planta ID ${plantId} añadida al usuario ID ${user.id}.`);
//                 res.redirect('/profile'); // Redirigir al perfil actualizado
//               }
//             );
//           }
//         );
//       });
//     });
//   } catch (error) {
//     console.error('Error procesando la compra:', error);
//     res.status(500).json({ error: 'Error interno del servidor.' });
//   }
// });

// Ruta para guardar la ruta de la imagen en la base de datos
router.post('/save-avatar', (req, res) => {
    const { userId, photoPath } = req.body; 
    console.log(`User ID: ${userId}, y Photo Path: ${photoPath}`);

    // Usar ? para evitar inyección SQL
    const query = `UPDATE usuarios SET photo_path = ? WHERE id = ?`;

    // Ejecutar la consulta de actualización
    db.run(query, [photoPath, userId], function (err) {
        if (err) {
            console.log('Error al actualizar la ruta de la imagen:', err);
            return res.render('profile', { 
              error: 'Error al guardar la ruta en la base de datos.',
              email: user.email,
              username: user.nombre,
              saldoAcumulado: awarded,
              goalSet: goalGoal, 
              plantasDisponibles: plantsAvailable,
              error: error,
              user: req.session.user
            });
        }

    });
});


router.get('/get-avatar', (req, res) => {
  const userId = req.session.user.id;

  const query = 'SELECT photo_path FROM usuarios WHERE id = ?';
  db.get(query, [userId], (err, row) => {
      if (err) {
          console.error('Error al obtener la ruta de la imagen:', err);
          return res.status(500).json({ error: 'Error al obtener la ruta de la imagen.' });
      }

      if (row) {
          res.json({ photoPath: row.photo_path });
      } else {
          res.json({ photoPath: null });
      }
  });
});



module.exports = router;