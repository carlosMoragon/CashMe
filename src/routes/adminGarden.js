// routes/adminGarden.js
const express = require('express');
const router = express.Router();
var sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');


const db = new sqlite3.Database('../cashme');

const fs = require('fs');

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images/plantas')); // Ruta donde se almacenará la imagen
    },
    filename: (req, file, cb) => {
        const { plantName } = req.body;  // Obtener el nombre de la planta del cuerpo de la solicitud
        const fileExtension = path.extname(file.originalname); // Obtener la extensión del archivo
        const newFileName = `${plantName}${fileExtension}`; // Nuevo nombre del archivo
        cb(null, newFileName); // Guardar el archivo con el nuevo nombre
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('El archivo no es una imagen válida.'));
        }
    }
});

// Middleware para manejar el formulario de la planta
router.post('/add-plant', upload.single('plantImage'), async (req, res) => {
    try {
        const { plantName, plantPrice } = req.body;
        const imagePath = `/img/plants/${req.file.filename}`;

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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing the form.' });
    }
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

