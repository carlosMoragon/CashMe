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

      //
      db.get('SELECT saldo FROM cuentas WHERE usuario_id = ?', [req.session.user.id], (err, cash) => {
        if (err) {
          console.error('Error al obtener el saldo del usuario:', err);
          res.status(500).send('Error al cargar los datos.');
          return;
        }

        // Verificar si el saldo existe
        if (!cash) {
          console.error('No se encontró saldo para el usuario.');
          // res.status(404).send('Saldo no encontrado');
          res.render('profile', { error: 'Saldo no encontrado' });
          return;
        }

        db.all("SELECT id, planta, evolucion FROM jardines", function (err, plantsAvailable) {
          if (err) {
              return next(err);
          }
          
        console.log('Se supone que el cash:', cash.saldo);
        let awarded = cash.saldo * 0.45;
        res.render('profile', { email: req.session.user.email, username: req.session.user.nombre, saldoAcumulado: awarded, plantasDisponibles: plantsAvailable });
      });
    });
    } else {
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
        return next(err);
      }
      req.session.user = {
        email: email,
        nombre: nombre,
        admin: 0
      };
      // Redirigir al perfil después de registrarse
      res.render('profile', { email: req.session.user.email, username: req.session.user.nombre });
    }
  );
});


router.get('/profile', function (req, res) {
  if (!req.session.username) {
    return res.redirect('/login'); // Redirige al login si no está logueado
  }

  res.render('profile', { username: req.session.username });
});

module.exports = router;