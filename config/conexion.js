const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Dracohunter#190603',
  database: process.env.DB_NAME || 'profesores',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.on('connection', (connection) => {
  console.log(`Nueva conexión establecida ID: ${connection.threadId}`);
});

pool.on('acquire', (connection) => {
  console.log(`Conexión adquirida ID: ${connection.threadId}`);
});

pool.on('error', (err) => {
  console.error('Error en el pool:', err);
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión exitosa a MySQL');
    await connection.ping();
    console.log('Ping exitoso a la base de datos');
    connection.release();
  } catch (err) {
    console.error('Fallo de conexión:', err.message);
  }
};

const query = async (sql, params) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (err) {
        console.error('Error en la consulta:', err);
        throw err;
    }
};

testConnection();

module.exports = {
    query,
    pool 
};