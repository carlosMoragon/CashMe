var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('login', { user: req.session.user });
});


router.post('/loginClient', function (req, res, next) {
  const email = req.body.email;
  const password = req.body.passwd;

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], function (err, row) {
    if (err) {
      return next(err);
    }

    if (row) {
      // Verificar la contraseña con bcrypt
      bcrypt.compare(password, row.password, function(err, isMatch) {
        if (err) {
          return next(err);
        }

        if (isMatch) {
          // Si las contraseñas coinciden, guarda la información en la sesión
          req.session.user = {
            id: row.id,
            email: row.email,
            nombre: row.nombre,
            admin: row.admin
          };

          console.log("REDIRIGE AL PROFILE");
          // Redirige a la página de perfil
          res.redirect('/profile');
        } else {
          // Si la contraseña no coincide
          res.render('login', { error: 'Invalid email or password', user: req.session.user });
        }
      });
    } else {
      // Si el usuario no existe
      res.render('login', { error: 'Invalid email or password' });
    }
  });
});



const saltRounds = 10; // Define el número de rondas para el hash 


// Registro Cliente
router.post('/registerClient', function (req, res, next) {
  const nombre = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  console.log("entra en registerclient");

  // Hashear la contraseña antes de guardarla
  bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
      console.error('Error al hashear la contraseña:', err);
      return res.render('login', { error: 'Error al hashear la contraseña. Inténtalo de nuevo.' });
    }

    // Guardar el usuario con la contraseña hasheada
    db.run(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hash],
      function (err) {
        if (err) {
          console.error('Error al registrar cliente:', err.message);
          return res.render('login', { error: 'Error al registrar el cliente. Por favor, verifica los datos e inténtalo de nuevo.' });
        }

        // Guarda la información del usuario en la sesión
        req.session.user = {
          id: this.lastID, // ID del último registro insertado
          email: email,
          nombre: nombre,
          admin: 0
        };
        console.log("guarda la info")
        // Redirige a la página de perfil después de registrarse
        res.redirect('../profile');
        console.log("redirige profile")
      }
      
    );
  });
});


module.exports = router;