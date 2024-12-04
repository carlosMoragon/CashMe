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
  db.get('SELECT saldo, goal FROM cuentas WHERE usuario_id = ?', [req.session.user.id], (err, cash) => {
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
        if (cash.goal == null) {
          goalGoal = cash.goal;
        }
      }


      // Renderizar la página de perfil
      res.render('profile', {
        email: req.session.user.email,
        username: req.session.user.nombre,
        saldoAcumulado: awarded,
        goalSet: goalGoal, 
        plantasDisponibles: plantsAvailable,
        error: error,
        page: 'profile'
      });
    });
  });
});


// Cuentas (AJAX)
router.get('/getAccounts', function (req, res) {
  if (!req.session.user) {
    return res.status(401).send({ error: 'No autorizado' });
  }

  const userId = req.session.user.id;

  db.all('SELECT id, saldo, notificaciones, goal FROM cuentas WHERE usuario_id = ?', [userId], (err, accounts) => {
    if (err) {
      console.error('Error al obtener las cuentas:', err);
      return res.status(500).send({ error: 'Error al cargar las cuentas.' });
    }

    res.send({ accounts });
  });
});

//Orianna: Probando algo
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

module.exports = router;