const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seed() {
  const username = process.env.ADMIN_USER || 'admin';
  let password = process.env.ADMIN_PASS;
  if (!password) {
    password = crypto.randomBytes(12).toString('hex'); // 24 hex chars
  }

  try {
    // Asegurar que la columna role existe (en caso de que las migraciones no se hayan ejecutado)
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'usuario';`);
    } catch (mErr) {
      // Ignorar errores no críticos de migración
      console.warn('Advertencia: no se pudo asegurar columna role (continuando):', mErr.message || mErr);
    }
    const res = await pool.query('SELECT id, role FROM users WHERE username = $1', [username]);
    if (res.rows && res.rows.length > 0) {
      const existing = res.rows[0];
      // Si ya existe, asegurarnos de que tiene role 'admin'. Si se pasó ADMIN_PASS, actualizar también la contraseña.
      if (existing.role !== 'admin' || process.env.ADMIN_PASS) {
        try {
          if (process.env.ADMIN_PASS) {
            const newHash = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET password = $1, role = $2 WHERE username = $3', [newHash, 'admin', username]);
            console.log(`Usuario '${username}' actualizado: role set to 'admin' and password updated (because ADMIN_PASS provided).`);
          } else {
            await pool.query('UPDATE users SET role = $1 WHERE username = $2', ['admin', username]);
            console.log(`Usuario '${username}' existente: role actualizado a 'admin'.`);
          }
        } catch (uErr) {
          console.error('Error actualizando usuario existente:', uErr.message || uErr);
          process.exit(1);
        }
      } else {
        console.log(`Usuario '${username}' ya existe y ya tiene role 'admin'. Nada que hacer.`);
      }
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)', [username, `${username}@example.com`, hash, 'admin']);
    console.log('Usuario admin insertado en la base de datos.');
    // Mostrar credenciales de forma concisa
    console.log(`Credenciales: usuario='${username}' contraseña=[oculta por seguridad, usa ADMIN_PASS env var para especificarla]`);
    console.log('Si necesitas ver la contraseña generada, ejecuta con ADMIN_PASS o revisa el script directamente. Cambia la contraseña tras el primer login.');
    process.exit(0);
  } catch (err) {
    console.error('Error al insertar usuario:', err.message || err);
    process.exit(1);
  }
}

seed();
