//profile.js
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {   
    res.render('profile', { email: req.session.nombre});
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