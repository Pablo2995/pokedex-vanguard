const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'pokedex',
    password: process.env.DB_PASSWORD || 'Pokedex2026!',
    database: process.env.DB_NAME || 'pokedex_2026',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Compatibilidad con MySQL 8+
    authPlugins: {
        mysql_clear_password: () => () => Buffer.from(''),
    }
});

const promisePool = pool.promise();

// Test connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err.message);

        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('');
            console.error('  ┌─────────────────────────────────────────────────┐');
            console.error('  │  SOLUCIÓN: Ejecuta en terminal (con sudo):       │');
            console.error('  │                                                   │');
            console.error('  │  sudo bash fix_mysql.sh                          │');
            console.error('  │                                                   │');
            console.error('  │  (Está en la raíz del proyecto Pokedex/)         │');
            console.error('  └─────────────────────────────────────────────────┘');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('  La BD "pokedex_2026" no existe. Ejecuta: sudo bash fix_mysql.sh');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('  MySQL no está corriendo. Inícialo con: sudo service mysql start');
        }
        return;
    }
    console.log('✅ Conectado a MySQL — Base de datos: pokedex_2026');
    connection.release();
});

module.exports = promisePool;
