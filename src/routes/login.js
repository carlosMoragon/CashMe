var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('login', {});
});


// LogIn del cliente
router.post('/loginClient', function (req, res, next) {
  const email = req.body.email;
  const password = req.body.passwd;

  db.get('SELECT * FROM usuarios WHERE email = ? AND password = ?', [email, password], function (err, row) {
    if (err) {
      return next(err);
    }

    if (row) {
      // Si el usuario existe
      req.session.user = {
        email: row.email,
        nombre: row.nombre,
        admin: row.admin,
        id: row.id
      };

      console.log('Sesión iniciada para el usuario:', req.session.user);

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
            error: error
          });
        });
      });
    } else {
      // Si el usuario no existe
      res.render('login', { error: 'Invalid email or password' });
    }
  });
});


// Registro Cliente
router.post('/registerClient', function (req, res, next) {
  const nombre = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  db.run(
    'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
    [nombre, email, password],
    function (err) {
      if (err) {
        console.error('Error al registrar cliente:', err.message);
        return res.render('login', { error: 'Error al registrar cliente. Inténtelo de nuevo.' });
      }

      // Sesión
      req.session.user = {
        email: email,
        nombre: nombre,
        admin: 0,
      };

      console.log('Registro exitoso. Sesión iniciada para el usuario:', req.session.user);

      // Obtener saldo del usuario
      db.get('SELECT saldo FROM cuentas WHERE usuario_id = ?', [req.session.user.id], (err, cash) => {
        if (err) {
          console.error('Error al obtener el saldo del usuario:', err);
          return res.render('login', { error: 'Error al cargar el saldo. Inténtelo más tarde.' });
        }

        // Obtener las plantas disponibles
        db.all("SELECT id, planta, evolucion FROM jardines", (err, plantsAvailable) => {
          if (err) {
            console.error('Error al obtener las plantas disponibles:', err);
            return res.render('login', { error: 'Error al cargar las plantas disponibles. Inténtelo más tarde.' });
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
            error: error
          });
        });
      });
    }
  );
});

/* 
router.get('/profile', function (req, res) {
  if (!req.session.username) {
    return res.redirect('/login'); // Redirige al login si no está logueado
  }

  res.render('profile', { username: req.session.username });
});
*/

module.exports = router;