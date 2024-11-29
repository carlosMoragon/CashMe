// routes/adminHome.js
const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.render('adminHome', { });
  });

module.exports = router;

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
