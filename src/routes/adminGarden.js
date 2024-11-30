// routes/adminGarden.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');


const db = new sqlite3.Database('../cashme');

// Configuración de multer para guardar imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '/images/plantas/'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname); // Asegurarte de guardar el archivo con su extensión original
        cb(null, Date.now() + ext); // Usa un nombre único basado en la fecha
    }
});

const upload = multer({ storage: storage });

router.post('/add-plant', upload.single('plantImage'), function (req, res) {
    const { plantName, plantPrice } = req.body;
    console.log(plantName, plantPrice);

    const imagePath = `/images/plantas/${plantName}.jpg`; // El error está aquí
    console.log(imagePath);

    const sql = "INSERT INTO jardines (planta, evolucion, cuenta_id) VALUES (?, ?, ?)";
    db.run(sql, [plantName, plantPrice, 0], function (err) {
        if (err) {
            console.log("Error al insertar en la base de datos: ", err);
            return res.status(500).json({ error: "Error inserting plant" });
        } else {
            console.log("Planta insertada correctamente");
            console.log("Ruta de la imagen: ", imagePath);
            return res.status(200).json({ message: "Plant added successfully", imagePath });
        }
    });
});

router.get('/', function (req, res, next) {
    db.all("SELECT id, planta, evolucion FROM jardines", function (err, rows) {
        if (err) {
            return next(err);
        }
        // console.log(rows);
        res.render('adminGarden', { plants: rows });
    });
});

module.exports = router;

