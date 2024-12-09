var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function (req, res, next) {
  const register = req.query.register && req.query.register === 'true';
  console.log('Register:', register);
  res.render('login', { user: req.session.user, register: register });
  
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
            admin: row.admin,
            active: row.activo
          };

          if (req.session.user.admin){
            res.redirect('../adminHome');
          }else if(req.session.user.active==0){
            res.redirect('../blockedUser');
          }else{
            res.redirect('../profile');
          }
        } else {
          // Si la contraseña no coincide
          res.render('login', { error: 'Invalid email or password', user: req.session.user});
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
  const isAdmin = req.body.isAdmin === 'on'; 
  const adminKey = req.body.adminKey || null;

  // Validación en Servidor
  let errors = [];

  //Nombre: al menos dos palabras
  if (!nombre || nombre.split(/\s+/).length < 2) {
    errors.push('Name must contain at least two words.');
  }

  // Contraseña: Al menos un num
  if (!password) {
    errors.push('Password is required.');
  } else if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }

  
  if (errors.length > 0) {
    return res.render('login', { error: 'Please correct the errors and try again.' });
  }

  // Validar clave de administrador si el usuario selecciona la opción
  if (isAdmin && adminKey !== ADMIN_SECRET_KEY) {
    console.error('Incorrect Admin Key');
    return res.render('login', { error: 'Incorrect Admin Key, try again later. ' });
  }

  // Hashear la contraseña antes de guardarla
  bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
      console.error('Error hashing the password:', err);
      return res.render('login', { error: 'Error hashing the password. Please try again.' });
    }

    const adminFlag = isAdmin ? 1 : 0;

    db.run(
      'INSERT INTO usuarios (nombre, email, password, admin) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, adminFlag],
      function (err) {
        if (err) {
          console.error('Error registering client:', err.message);
          return res.render('login', { error: 'Error registering the client. Please check the data and try again.' });
        }

        req.session.user = {
          id: this.lastID, 
          email: email,
          nombre: nombre,
          admin: adminFlag
        };

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