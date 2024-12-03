var express = require('express');
var bcrypt = require('bcrypt');
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

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], function (err, row) {
    if (err) {
      console.error('Error al buscar el usuario:', err);
      return res.status(500).send({ message: 'Error al procesar la solicitud.' });
    }

    if (row) {
      // Comparar la contraseña encriptada
      bcrypt.compare(password, row.password, (err, isMatch) => {
        if (err) {
          console.error('Error al comparar contraseñas:', err);
          return res.status(500).send({ message: 'Error interno.' });
        }

        if (isMatch) {
          // Si el usuario existe y la contraseña es correcta
          req.session.user = {
            email: row.email,
            nombre: row.nombre,
            admin: row.admin,
            id: row.id
          };

          console.log('Sesión iniciada para el usuario:', req.session.user);

          db.get('SELECT saldo FROM cuentas WHERE usuario_id = ?', [req.session.user.id], (err, cash) => {
            if (err) {
              console.error('Error al obtener el saldo del usuario:', err);
              return res.status(500).send({ message: 'Error al cargar los datos.' });
            }

            // Verificar si el saldo existe
            if (!cash) {
              console.error('No se encontró saldo para el usuario.');
              return res.status(404).send({ message: 'Saldo no encontrado.' });
            }

            db.all("SELECT id, planta, evolucion FROM jardines", function (err, plantsAvailable) {
              if (err) {
                console.error('Error al obtener plantas disponibles:', err);
                return res.status(500).send({ message: 'Error al cargar los datos.' });
              }

              console.log('Se supone que el cash:', cash.saldo);
              let awarded = cash.saldo * 0.45;
              res.render('profile', {
                email: req.session.user.email,
                username: req.session.user.nombre,
                saldoAcumulado: awarded,
                plantasDisponibles: plantsAvailable
              });
            });
          });
        } else {
          res.render('login', { error: 'Invalid email or password' });
        }
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

  // Encriptar la contraseña
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error al encriptar contraseña:', err);
      return res.status(500).send({ message: 'Error al procesar la solicitud.' });
    }

    db.run(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword],
      function (err) {
        if (err) {
          console.error('Error al registrar cliente:', err.message);
          return res.status(500).send({ message: 'Error al registrar el cliente.' });
        }
        req.session.user = {
          email: email,
          nombre: nombre,
          admin: 0
        };
        // Redirigir al perfil después de registrarse
        res.render('profile', {
          email: req.session.user.email,
          username: req.session.user.nombre
        });
      }
    );
  });
});

router.get('/profile', function (req, res) {
  if (!req.session.username) {
    return res.redirect('/login'); // Redirige al login si no está logueado
  }

  res.render('profile', { username: req.session.username });
});

module.exports = router;
