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
    const res = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (res.rows && res.rows.length > 0) {
      console.log(`Usuario '${username}' ya existe. No se realizará inserción.`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, `${username}@example.com`, hash]);
    console.log('Usuario insertado en la base de datos.');
    console.log(`Credenciales: ${username} / ${password}`);
    console.log('Por seguridad, cambia la contraseña tras el primer login.');
    process.exit(0);
  } catch (err) {
    console.error('Error al insertar usuario:', err.message || err);
    process.exit(1);
  }
}

seed();
