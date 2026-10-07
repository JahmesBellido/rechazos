const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const ANALISIS_COLUMNS = [
  { name: 'cajas_motivo', ddl: 'INT DEFAULT 0' },
  { name: 'unidades_motivo', ddl: 'INT DEFAULT 0' },
  { name: 'cantidad_motivo', ddl: 'INT DEFAULT 0' },
];

const ANALISIS_DROP_COLUMNS = ['cod_cliente', 'razon_social'];

async function tableExists(table) {
  const [rows] = await pool.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
    [table]
  );
  return rows.length > 0;
}

async function columnExists(table, column) {
  const [rows] = await pool.query(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
    [table, column]
  );
  return rows.length > 0;
}

async function createAnalisisIfMissing() {
  if (await tableExists('analisis')) return;
  const sqlPath = path.join(__dirname, '..', '..', 'database', 'analisis.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  for (const stmt of sql.split(';')) {
    const trimmed = stmt.trim();
    if (trimmed) await pool.query(trimmed);
  }
  console.log('[migrate] Tabla analisis creada');
}

async function run() {
  await createAnalisisIfMissing();

  for (const col of ANALISIS_COLUMNS) {
    if (await columnExists('analisis', col.name)) {
      console.log(`[migrate] analisis.${col.name} ya existe`);
      continue;
    }
    await pool.query(`ALTER TABLE analisis ADD COLUMN ${col.name} ${col.ddl}`);
    console.log(`[migrate] analisis.${col.name} agregada`);
  }

  for (const name of ANALISIS_DROP_COLUMNS) {
    if (!(await columnExists('analisis', name))) continue;
    await pool.query(`ALTER TABLE analisis DROP COLUMN ${name}`);
    console.log(`[migrate] analisis.${name} eliminada`);
  }

  console.log('[migrate] Esquema al dia');
}

run()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('[migrate] Error:', err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  });
