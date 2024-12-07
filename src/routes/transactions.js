const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

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
    const { tipo, dinero, descripcion, fecha, id_cuenta } = req.body;
    const userId = req.session.user.id;

    console.log("Usuario logueado con ID:", userId);
    console.log("Cuenta seleccionada para la transacción:", id_cuenta);

    db.run('INSERT INTO transacciones (tipo, dinero, descripcion, fecha, id_cuenta) VALUES (?, ?, ?, ?, ?)', [tipo, dinero, descripcion, fecha, id_cuenta], (err) => {
        if (err) {
            console.error('Error al agregar transacción:', err.message);
            res.status(500).send('Error en el servidor');
        }

        //res.redirect('/transactions');
    });
    // Actualizar el saldo de la cuenta teniendo en cuanta el tipo de transacción
    if (tipo === 'INGRESO') {
        db.run('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?', [dinero, id_cuenta], (err) => {
            if (err) {
                console.error('Error al actualizar saldo:', err.message);
                res.status(500).send('Error en el servidor');
            }
            else {
                console.log('Saldo actualizado correctamente');
                res.redirect('/transactions');
            }
        });
    }

    if (tipo === 'GASTO') {
        db.run('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?', [dinero, id_cuenta], (err) => {
            if (err) {
                console.error('Error al actualizar saldo:', err.message);
                res.status(500).send('Error en el servidor');
            }
            else {
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

module.exports = router;
