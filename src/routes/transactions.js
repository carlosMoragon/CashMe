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

    // COmpruebo si ha logueado
    if (!user) {
        return res.redirect('/login');
    }

    // Consultas anidadas para primero obtener la cuenta del usuario y luego las transacciones de esa cuenta
    db.all('SELECT * FROM cuentas WHERE usuario_id = ?', [user.id], (err, cuentas) => {
        if (err) {
            console.error('Error al obtener cuentas:', err.message);
            return res.status(500).send('Error en el servidor');
        }

        db.all('SELECT * FROM transacciones WHERE id_cuenta = ?', [cuentas[0]?.id], (err, rows) => {
            if (err) {
                console.error('Error al obtener transacciones:', err.message);
                return res.status(500).send('Error en el servidor');
            }

            res.render('transactions', { transactions: rows, user, cuentas });
        });
    });
});


// AÑADIR UNA TRANSACCIÓN
router.post('/add', (req, res) => {
    const { tipo, dinero, descripcion, fecha, id_cuenta } = req.body;
    const userId = req.session.user.id;

    db.run(
        'INSERT INTO transacciones (tipo, dinero, descripcion, fecha, id_cuenta) VALUES (?, ?, ?, ?, ?)',
        [tipo, dinero, descripcion, fecha, id_cuenta],
        (err) => {
            if (err) {
                console.error('Error al insertar transacción:', err.message);
                return res.status(500).send('Error en el servidor'); 
            }

            // Luego de insertar la transacción, busca el saldo actual de la cuenta
            db.get(
                'SELECT saldo, goal, monedasAcumuladas FROM cuentas WHERE usuario_id = ?',
                [userId],
                (err, row) => {
                    if (err) {
                        console.error('Error al buscar el registro:', err.message);
                        return res.status(500).send('Error en el servidor'); 
                    }

                    let nuevoSaldo;
                    if (row) {
                        if (tipo === 'GASTO') {
                            nuevoSaldo = parseFloat(row.saldo) - parseFloat(dinero);  
                        } else {
                            nuevoSaldo = parseFloat(row.saldo) + parseFloat(dinero);  
                        }

                        db.run(
                            'UPDATE cuentas SET saldo = ? WHERE usuario_id = ?',
                            [nuevoSaldo, userId],
                            (err) => {
                                if (err) {
                                    console.error('Error al actualizar el saldo:', err.message);
                                    return res.status(500).send('Error en el servidor');
                                }

                                // Si el saldo alcanza o supera el goal, actualizamos las monedas acumuladas
                                if (nuevoSaldo >= row.goal && tipo != 'GASTO') {
                                    const monedasAcumuladas = (row.monedasAcumuladas || 0) + (nuevoSaldo * 0.45);

                                    // Actualizamos las monedas acumuladas
                                    db.run(
                                        'UPDATE cuentas SET monedasAcumuladas = ? WHERE usuario_id = ?',
                                        [monedasAcumuladas, userId],
                                        (err) => {
                                            if (err) {
                                                console.error('Error al actualizar las monedas acumuladas:', err.message);
                                                return res.status(500).send('Error en el servidor');
                                            }
                                            console.log('Monedas acumuladas actualizadas con éxito');
                                        }
                                    );

                                    // Si el goal se alcanza o supera, ponemos goal a NULL 
                                    db.run(
                                        'UPDATE cuentas SET goal = NULL WHERE usuario_id = ?',
                                        [userId],
                                        (err) => {
                                            if (err) {
                                                console.error('Error al actualizar el goal:', err.message);
                                                return res.status(500).send('Error en el servidor');
                                            }
                                            console.log('Goal actualizado a NULL');
                                            return res.redirect('/transactions');
                                        }
                                    );
                                } else {
                                    return res.redirect('/transactions');
                                }
                            }
                        );
                    } else {
                        db.run(
                            'INSERT INTO cuentas (saldo, notificaciones, oscuro, usuario_id, goal, monedasAcumuladas) VALUES (?, ?, ?, ?, ?, ?)',
                            [dinero, 0, 0, userId, 0, 0],  
                            (err) => {
                                if (err) {
                                    console.error('Error al insertar el registro:', err.message);
                                    return res.status(500).send('Error en el servidor');
                                }
                                console.log('Registro insertado con éxito');
                                return res.redirect('/transactions');
                            }
                        );
                    }
                }
            );
        }
    );
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
