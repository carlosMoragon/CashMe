const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');



// CONEXIÓN
const db = new sqlite3.Database('../cashme', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos SQLite');
    }
});

// OBETENER TODAS LAS TRANSACCIONES
router.get('/', (req, res) => {
    const user = req.session.user;

    // Compruebo si ha iniciado sesión
    if (!user) {
        return res.redirect('/login');
    }

    // Leer el parámetro opcional para filtrar por cuenta
    const selectedCuentaId = req.query.id_cuenta;

    // Consultar las cuentas del usuario
    db.all('SELECT * FROM cuentas WHERE usuario_id = ?', [user.id], (err, cuentas) => {
        if (err) {
            console.error('Error al obtener cuentas:', err.message);
            return res.status(500).send('Error en el servidor');
        }

        // Si no hay cuentas, devolver la vista sin transacciones
        if (cuentas.length === 0) {
            return res.render('transactions', { transactions: [], user, cuentas, selectedCuentaId });
        }

        // Construir la consulta para obtener las transacciones
        let query = 'SELECT * FROM transacciones WHERE id_cuenta IN (' + cuentas.map(() => '?').join(',') + ')';
        const params = cuentas.map(cuenta => cuenta.id);

        if (selectedCuentaId) {
            query = 'SELECT * FROM transacciones WHERE id_cuenta = ?';
            params.length = 0; 
            params.push(selectedCuentaId); 
        }

        // Consultar las transacciones
        db.all(query, params, (err, transactions) => {
            if (err) {
                console.error('Error al obtener transacciones:', err.message);
                return res.status(500).send('Error en el servidor');
            }

            // Renderizar la vista con las transacciones filtradas
            res.render('transactions', {
                transactions,
                user,
                cuentas,
                selectedCuentaId, 
            });
        });
    });
});


// AÑADIR UNA TRANSACCIÓN
router.post('/add', (req, res) => {
    let { tipo, dinero, descripcion, fecha, id_cuenta } = req.body;
    const userId = req.session.user.id;

    // Asegurarse de que 'dinero' tenga dos decimales
    dinero = parseFloat(Math.abs(parseFloat(dinero)).toFixed(2));

    console.log("Usuario logueado con ID:", userId);
    console.log("Cuenta seleccionada para la transacción:", id_cuenta);

    // Insertar la transacción
    db.run('INSERT INTO transacciones (tipo, dinero, descripcion, fecha, id_cuenta) VALUES (?, ?, ?, ?, ?)', [tipo, dinero, descripcion, fecha, id_cuenta], (err) => {
        if (err) {
            console.error('Error al agregar transacción:', err.message);
            res.status(500).send('Error en el servidor');
            return;
        }
    });

    // Actualizar el saldo de la cuenta teniendo en cuenta el tipo de transacción
    if (tipo === 'INGRESO') {
        db.run('UPDATE cuentas SET saldo = ROUND(saldo + ?, 2) WHERE id = ?', [dinero, id_cuenta], (err) => {
            if (err) {
                console.error('Error al actualizar saldo:', err.message);
                res.status(500).send('Error en el servidor');
            } else {
                console.log('Saldo actualizado correctamente');
                res.redirect('/transactions');
            }
        });
    }

    if (tipo === 'GASTO') {
        db.run('UPDATE cuentas SET saldo = ROUND(saldo - ?, 2) WHERE id = ?', [dinero, id_cuenta], (err) => {
            if (err) {
                console.error('Error al actualizar saldo:', err.message);
                res.status(500).send('Error en el servidor');
            } else {
                console.log('Saldo actualizado correctamente');
                res.redirect('/transactions');
            }
        });
    }
});



//Cuando se ingresa dinero en la cuenta. Se verifica con el goal  const selectSql = "SELECT goal FROM cuentas WHERE usuario_id = ?";
//del usuario.
// Cuando el dinero en saldo, de la cuenta es igual o mayor al goal. Se va a meter el ese saldo actual *0.45 en monedasacumuladas.
// const nuevoSaldo = totalAcumulado - plantPrice;
    // const updateTotalAcummulated = "UPDATE cuentas SET monedasAcumuladas = ? WHERE usuario_id = ?";

// ELIMINAR 
router.post('/delete/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM transacciones WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error al eliminar transacción:', err.message);
            res.status(500).send('Error en el servidor');
        } else {
            res.redirect('/transactions');
        }
    });
});


/*
Para guardar el excel temporalmente necesitaremos multer
*/
// Configuración de multer para guardar el archivo temporalmente en la carpeta 'uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta de destino para guardar archivos
    },
    filename: (req, file, cb) => {
        req.session.filename = Date.now() + path.extname(file.originalname);
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para evitar colisiones
    }
});

const upload = multer({ storage });

// Importar datos Kutxabank
router.post('/importKutxabank', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        // Ruta nuevo excel
        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const workbook = XLSX.readFile(filePath);

        const sheet_name_list = workbook.SheetNames;
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
            header: 1, // Leer como filas con índice
        });

        const headers = rawData[1]; // fila de encabezados está en el índice 1
        const dataRows = rawData.slice(2); // Las filas de datos comienzan después del encabezado

        // Reorganizar los datos
        const structuredData = dataRows
            .filter(row => {
                // fecha tiene el formato "dd/mm/yyyy" se queda
                const fecha = row[0];
                return typeof fecha === 'string' && /^[0-3][0-9]\/[0-1][0-9]\/\d{4}$/.test(fecha);
            })
            .map(row => {
                const fecha = row[0];

                return {
                    fecha: fecha,
                    concepto: row[1]?.trim() || '',
                    fecha_valor: row[2] || '',
                    importe: (typeof row[3] === 'number' && !isNaN(row[3]) ? row[3].toFixed(2) : '0.00'),
                    saldo: (typeof row[4] === 'number' && !isNaN(row[4]) ? row[4].toFixed(2) : '0.00'),
                };
            });

        // Eliminar el archivo después de procesarlo
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error al eliminar el archivo:', err);
            } else {
                console.log('Archivo eliminado correctamente');
            }
        });

        res.json(structuredData);
    } catch (error) {
        console.error('Error al leer el archivo:', error);
        res.status(500).send('Error al procesar el archivo Excel');
    }
});


// Guardar info importación
router.post('/add-import', (req, res) => {
    const { transactions, accountId } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).send('No valid transactions received');
    }

    const userId = req.session.user.id;

    transactions.forEach((transaction, index) => {
        // Mapeamos valores
        const tipo = parseFloat(transaction.importe) < 0 ? 'GASTO' : 'INGRESO';
        const dinero = parseFloat(Math.abs(parseFloat(transaction.importe)).toFixed(2)); // Redondeo a 2 decimales
        const descripcion = transaction.concepto;
        // Fecha con "-" en vez de con "/"
        const fechaParts = transaction.fecha_valor.split('/');
        const fecha = `${fechaParts[2]}-${fechaParts[1]}-${fechaParts[0]}`;

        console.log(`Transaction ${index + 1} type: ${tipo} Amount: ${dinero} Description: ${descripcion}`);

        db.run('INSERT INTO transacciones (tipo, dinero, descripcion, fecha, id_cuenta) VALUES (?, ?, ?, ?, ?)',
            [tipo, dinero, descripcion, fecha, accountId], (err) => {
                if (err) {
                    console.error('Error adding imported transaction:', err.message);
                    return res.status(500).send('Server error');
                }
                console.log(`Transaction ${index + 1} imported successfully`);
            });

        // Actualiza el saldo de la cuenta en función del tipo de transacción
        if (tipo === 'INGRESO') {
            db.run('UPDATE cuentas SET saldo = ROUND(saldo + ?, 2) WHERE id = ?', [dinero, accountId], (err) => {
                if (err) {
                    console.error('Error updating balance:', err.message);
                    return res.status(500).send('Server error');
                }
                console.log(`Balance updated for transaction ${index + 1} (type: INGRESO)`);
            });
        } else if (tipo === 'GASTO') {
            db.run('UPDATE cuentas SET saldo = ROUND(saldo - ?, 2) WHERE id = ?', [dinero, accountId], (err) => {
                if (err) {
                    console.error('Error updating balance:', err.message);
                    return res.status(500).send('Server error');
                }
                console.log(`Balance updated for transaction ${index + 1} (type: GASTO)`);
            });
        }
    });

    // Verifica el saldo de la cuenta después de la primera transacción para mostrarlo en los logs
    db.get('SELECT saldo FROM cuentas WHERE id = ?', [accountId], (err, row) => {
        if (err) {
            console.error('Error fetching the balance:', err.message);
            return res.status(500).send('Server error');
        }
        if (row) {
            console.log('Current balance of the account after the first transaction:', row.saldo);
        } else {
            console.log('No account found with the given ID.');
        }
    });

    res.status(200).send(`
        <script>
            window.location.reload();
        </script>
    `);
    
});


// Exportar Gastos a un CSV
router.get('/export-csv/:id_cuentaParam', (req, res) => {
    console.log("Entra en export-csv");
    const { id_cuentaParam } = req.params;

    const query = 'SELECT tipo, dinero, descripcion, fecha, id_cuenta FROM transacciones WHERE id_cuenta = ?';

    db.all(query, [id_cuentaParam], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).send('Error al obtener las transacciones.');
        }

        if (results.length === 0) {
            return res.status(404).send('No se encontraron transacciones para esta cuenta.');
        }

        
        console.log("========= RESULT ==========");
        console.log(results);
        console.log("==================================");


        try {
            const fields = ['tipo', 'dinero', 'descripcion', 'fecha', 'id_cuenta'];
            const parser = new Parser({ fields });

            const csv = parser.parse(results);

            // archivo temporal
            const filePath = `./transactions_${id_cuentaParam}.csv`;
            fs.writeFileSync(filePath, csv);

            // Envía como descarga
            res.download(filePath, `transactions_${id_cuentaParam}.csv`, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                }

                // Elimina archivo
                fs.unlinkSync(filePath);
            });
        } catch (error) {
            console.error('Error al generar el CSV:', error);
            res.status(500).send('Error al generar el archivo CSV.');
        }
    });
});



module.exports = router;
