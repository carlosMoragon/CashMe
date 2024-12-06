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
  db.get('SELECT saldo, goal, monedasAcumuladas FROM cuentas WHERE usuario_id = ?', [user.id], (err, cash) => {
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
        awarded = cash.monedasAcumuladas;
        console.log('Saldo acumulado:', awarded);
        if (cash.goal != null) {
          goalGoal = cash.goal;
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
//   //plnta price
//   try {
//     const getTotalAcummulated = "SELECT monedasAcumuladas FROM cuentas WHERE usuario_id = ?";
//     const userId = req.session.user.id;
//     db.run(getTotalAcummulated, [userId], function (err, row) {
//       if (err) {
//         console.error(err.message);
//       } else {
//         console.log(`Total acumulado: ${row.monedasAcumuladas}`);
//         totalAcumulado = row.monedasAcumuladas;
//       }
//       if (totalAcumulado < plantPrice) {
//         console.log('Saldo insuficiente para comprar esta planta.');
//         return res.status(400).json({ error: 'Saldo insuficiente para comprar esta planta.' });
//       } else {
//         totalAcumulado = totalAcumulado - plantPrice;
//         const updateTotalAcummulated = "UPDATE cuentas SET monedasAcumuladas = ? WHERE usuario_id = ?";
//         db.run(updateTotalAcummulated, [totalAcumulado, userId], function (err) {
//           if (err) {
//             console.error(err.message);
//           } else {
//             console.log(`Total acumulado actualizado: ${totalAcumulado}`);
//           }
//         });

//         const updateJardines = "UPDATE jardines SET usuario_id = ? WHERE id = ?"; //Mirarla
//         db.run(updateJardines, [userId, plantId], function (err) {
//           if (err) {
//             console.error(err.message);
//           } else {
//             console.log(`Jardín actualizado con el ID ${plantId}`);
//             res.redirect('/profile');
//           }
//         });
//       }});
//     } catch (error) {
//       console.error('Error procesando la compra:', error);
//       res.status(500).json({ error: 'Error interno del servidor.' });
//     }
//   });


// db.get('SELECT evolucion FROM jardines WHERE id = ?', [plantId], (err, plant) => {
//   const plantPrice = plant.evolucion;
// Actualizar saldo del usuario en la base de datos

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