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

          if (req.session.user.admin){
            res.redirect('../adminHome');
          }else{
            res.redirect('../profile');
          }
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



const saltRounds = 10; 
const ADMIN_SECRET_KEY = "CashMe"; // Clave secreta para admins

// Registro Cliente
router.post('/registerClient', function (req, res, next) {
  const nombre = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const isAdmin = req.body.isAdmin === 'on'; // Checkbox devuelve 'on' si está marcado
  const adminKey = req.body.adminKey || null; // Clave de administrador (si aplica)

  console.log("entra en registerclient");

  // Validar clave de administrador si el usuario selecciona la opción
  if (isAdmin && adminKey !== ADMIN_SECRET_KEY) {
    console.error('Clave de administrador incorrecta.');
    return res.render('login', { error: 'Clave de administrador incorrecta. Inténtalo de nuevo.' });
  }

  // Hashear la contraseña antes de guardarla
  bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
      console.error('Error al hashear la contraseña:', err);
      return res.render('login', { error: 'Error al hashear la contraseña. Inténtalo de nuevo.' });
    }

    const adminFlag = isAdmin ? 1 : 0;

    db.run(
      'INSERT INTO usuarios (nombre, email, password, admin) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, adminFlag],
      function (err) {
        if (err) {
          console.error('Error al registrar cliente:', err.message);
          return res.render('login', { error: 'Error al registrar el cliente. Por favor, verifica los datos e inténtalo de nuevo.' });
        }

        req.session.user = {
          id: this.lastID, 
          email: email,
          nombre: nombre,
          admin: adminFlag
        };
        console.log("guarda la info");

        if (adminFlag){
          res.redirect('../adminHome');
        }else{
          res.redirect('../profile');
        }
      }
    );
  });
});



module.exports = router;