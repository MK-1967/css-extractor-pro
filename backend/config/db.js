const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'css_user',
  password: process.env.DB_PASS || 'CssPass123!',
  database: process.env.DB_NAME || 'css_extractor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
