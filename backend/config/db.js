const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sslEnabled = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

const ssl = sslEnabled
  ? (process.env.DB_CA_CERT && fs.existsSync(process.env.DB_CA_CERT)
      ? { ca: fs.readFileSync(process.env.DB_CA_CERT), rejectUnauthorized: true }
      : { rejectUnauthorized: false })
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(ssl ? { ssl } : {})
});

module.exports = pool;
