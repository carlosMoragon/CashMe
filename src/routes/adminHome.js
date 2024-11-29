// routes/adminHome.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// router.get('/', function(req, res, next) {
//     res.render('adminHome', { });
//   });


const db = new sqlite3.Database('../cashme');
 
router.get('/', function(req, res, next) {
    // Hacer la consulta a la base de datos
    db.all('SELECT nombre, email FROM usuarios', (err, rows) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            res.status(500).send('Error al cargar los usuarios.');
            return;
        }

        // Pasar los datos de usuarios a la vista
        res.render('adminHome', { usuarios: rows });
    });
});



// document.addEventListener("DOMContentLoaded", () => {
//     const ctx = document.getElementById('myChart').getContext('2d');
//     const myChart = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//             datasets: [{
//                 label: 'Sample Data',
//                 data: [12, 19, 3, 5, 2, 3, 7],
//                 backgroundColor: 'rgba(54, 162, 235, 0.2)',
//                 borderColor: 'rgba(54, 162, 235, 1)',
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             scales: {
//                 y: {
//                     beginAtZero: true
//                 }
//             }
//         }
//     });
// });



module.exports = router;