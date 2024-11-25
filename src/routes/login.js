var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { });
});

//FALTA HASHES PARA LA SEGURIDAD

/*
router.post('/loginClient', function(req, res, next) {
  const email = req.body.email;
  const passwd = req.body.passwd;

  if (email === 'admin') {
    req.session.email =email;
    console.log("CLIENTE HA ENTRADO")
    res.render('profile', { email: req.session.email });
  } else {
    res.redirect('/');
  }
});
*/


// LogIn del cliente
router.post('/loginClient', function(req, res, next) {
  const email = req.body.email;
  const password = req.body.passwd;

  db.get('SELECT * FROM usuarios WHERE email = ? AND password = ?', [email, password], function(err, row) {
    if (err) {
      return next(err);
    }

    if (row) {
      // Si el usuario existe
      console.log('el usuario existe: ');
      console.log(email);
      res.render('profile', { email: req.session.email });
    } else {
      res.render('login', { error: 'Invalid email or password' });
    }
  });
});


// Registro Cliente
router.post('/registerClient', function(req, res, next) {
  const nombre = req.body.name;  
  const email = req.body.email;
  const password = req.body.password;

  db.run(
    'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', 
    [nombre, email, password], 
    function(err) {
      if (err) {
        console.error('Error al registrar cliente:', err.message);
        return next(err);
      }
      // Redirigir al perfil después de registrarse
      res.render('profile', { email: req.session.email });
    }
  );
});


router.get('/profile', function(req, res) {
  if (!req.session.username) {
    return res.redirect('/login'); // Redirige al login si no está logueado
  }

  res.render('profile', { username: req.session.username });
});

module.exports = router;