const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Dracohunter#190603',
  database: process.env.DB_NAME || 'profesores',
  max: 10, 
  idleTimeoutMillis: 30000 
});

pool.on('connect', (client) => {
  console.log(`Nueva conexión establecida`);
});

pool.on('error', (err, client) => {
  console.error('Error inesperado en el cliente PostgreSQL:', err);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión exitosa a PostgreSQL');
    await client.query('SELECT 1');
    console.log('Ping exitoso a la base de datos');
    client.release();
  } catch (err) {
    console.error('Fallo de conexión:', err.message);
  }
};

const query = async (sql, params = []) => {
  try {
    let pgSql = sql;
    let paramIndex = 0;
    pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
    pgSql = pgSql.replace(/DATE_FORMAT\(([^,]+),\s*'%d\/%m\/%Y'\)/gi, "TO_CHAR($1, 'DD/MM/YYYY')");
    
    const result = await pool.query(pgSql, params);
    return result.rows;
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