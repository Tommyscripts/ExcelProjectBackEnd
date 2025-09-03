const { Pool } = require('pg');

const connStr = process.env.DATABASE_URL;
/**
 * Permite conectarse vía DATABASE_URL o mediante variables individuales.
 * Defaults de desarrollo: postgres:postgres@127.0.0.1:5432/excel_db
 */
const config = connStr
  ? { connectionString: connStr }
  : {
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'excel_db',
    };

if (process.env.NODE_ENV === 'production') {
  config.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(config);

module.exports = pool;
