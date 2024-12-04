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
  db.get('SELECT saldo FROM cuentas WHERE usuario_id = ?', [req.session.user.id], (err, cash) => {
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

      // Verificar si existe el saldo
      if (!cash) {
        console.error('No se encontró saldo para el usuario.');
        error = 'Saldo no encontrado';
      } else {
        console.log('Saldo del usuario:', cash.saldo);
        awarded = cash.saldo * 0.45;
      }

      // Renderizar la página de perfil
      res.render('profile', {
        email: req.session.user.email,
        username: req.session.user.nombre,
        saldoAcumulado: awarded,
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


module.exports = router;