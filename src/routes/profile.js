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

      db.all("SELECT plantasAdquiridas FROM usuarios WHERE id = ?", [user.id], (err, plantas) => {
        if (err) {
          console.error('Error al obtener las plantas adquiridas:', err);
          res.status(500).send('Error al cargar las plantas adquiridas.');
          return;
        }
        let plantsAcquired;
        let plantasString = plantas[0].plantasAdquiridas;
        if (plantasString.length > 0) {

          plantsAcquired = plantasString.split(";");
          plantsAcquired.shift();
          
          console.log("------------------------------------------------------------------------------------");
          console.log(plantsAcquired);
          console.log("------------------------------------------------------------------------------------");

        } else {
          console.log('No se encontraron plantas adquiridas.');
          //plantsAcquired; 
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
          plantasAdquiridas: plantsAcquired,
          error: error,
          user: req.session.user
        });
      });
    }
    );
  });
});

router.post('/createAccount', function (req, res) {
  const userId = req.session.user.id;

  const insertSql = "INSERT INTO cuentas (saldo, notificaciones, oscuro, usuario_id, goal, monedasAcumuladas) VALUES (0, 0, 0, ?, 0, 0)";
  db.run(insertSql, [userId], function (err) {
    if (err) {
      console.error('Error al crear la cuenta:', err.message);
      return res.status(500).json({ error: 'Error al crear la cuenta.' });
    }
    console.log(`Cuenta creada con éxito para el usuario ${userId}`);
    res.status(200).json({ message: 'Cuenta creada con éxito.' });
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

// Función para comprar una planta
router.post('/comprarPlanta', (req, res) => {
  const { plantId, plantPrice } = req.body;
  const userId = req.session.user.id;
  // console.log(`El Usuario ${userId} quiere comprar la planta ${plantId} por ${plantPrice} monedas.`); // "Debugging"
  const getTotalAcummulated = "SELECT monedasAcumuladas FROM cuentas WHERE usuario_id = ?";
  db.get(getTotalAcummulated, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching accumulated balance:', err.message);
      return res.status(500).json({ error: 'Internal error while fetching balance.' });
    }

    const totalAcumulado = row.monedasAcumuladas;
    if (totalAcumulado < plantPrice) {
      return res.status(400).json({ error: 'Insufficient balance to purchase this plant.' });
    }

    // Actualizar las monedas acumuladas
    const nuevoSaldo = totalAcumulado - plantPrice;
    // console.log(`Monedas restantes: ${nuevoSaldo}`); // "Debugging"

    const updateTotalAcummulated = "UPDATE cuentas SET monedasAcumuladas = ? WHERE usuario_id = ?";
    db.run(updateTotalAcummulated, [nuevoSaldo, userId], function (err) {
      if (err) {
        console.error('Error updating accumulated coins:', err.message);
        return res.status(500).json({ error: 'Internal error while updating balance.' });
      }
      // console.log("Descuento de las monedas."); // "Debugging"

      // Obtener las plantas adquiridas por el usuario
      const selectQuery = "SELECT plantasAdquiridas FROM usuarios WHERE id = ?";
      db.get(selectQuery, [userId], function (err, plants) {
        if (err) {
          console.error('Error obteniendo las plantas actuales:', err.message);
          return res.status(500).json({ error: 'Internal error while registering plant.' });
        }
        let planta;
        if (plants.plantasAdquiridas != undefined & plants.plantasAdquiridas != null) {
          planta = plants.plantasAdquiridas;
        } else {
          planta = '';
        }

        // console.log(`Plants acquired by user: ${planta}`); //Debbuging
        let plantaAdd = planta + ';' + plantId;
        // console.log(`Plantas aquiridas: ${plantaAdd}`); //Hasta aqui funciona

        const updateJardinUsuario = "UPDATE usuarios SET plantasAdquiridas = ? WHERE id = ?";
        db.run(updateJardinUsuario, [plantaAdd, userId], function (err) {
          if (err) {
            console.error('Error updating garden:', err.message);
            return res.status(500).json({ error: 'Internal error while registering plant.' });
          }

          console.log(`Compra registrada en la bbddd. Planta: ${plantId} Usuario: ${userId}`);
          res.status(200).json({ message: 'Plant successfully purchased.' });
        });
      });
    });
  });
});



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