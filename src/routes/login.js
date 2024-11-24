var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('../cashme.db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { });
});

//FALTA HASHES PARA LA SEGURIDAD

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

/* FALTA CONECTAR LA BASE DE DATOS
// LogIn del cliente
router.post('/loginClient', function(req, res, next) {
  const email = req.body.email;
  const passwd = req.body.passwd;

  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, passwd], function(err, row) {
    if (err) {
      return next(err);
    }

    if (row) {
      // Si el usuario existe
      res.redirect('/profile');
    } else {
      res.render('login', { error: 'Invalid email or password' });
    }
  });
});
*/

// Registro Cliente
router.post('/registerClient', function(req, res, next) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], function(err) {
    if (err) {
      return next(err);
    }
    // Redirigir al profile después de registrarse
    res.redirect('/profile');
  });
});

router.get('/profile', function(req, res) {
  if (!req.session.username) {
    return res.redirect('/login'); // Redirige al login si no está logueado
  }

  res.render('profile', { username: req.session.username });
});

module.exports = router;