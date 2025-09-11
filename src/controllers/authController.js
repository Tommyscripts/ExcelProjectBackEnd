const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, hashedPassword, role || 'usuario']
    );
    res.status(201).json({ message: 'Usuario registrado correctamente', userId: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Usuario o email ya existe' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
  console.log('[auth] login attempt:', { username });
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta' });
  // Devolver role para el frontend
  res.json({ message: 'Login exitoso', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Listar usuarios (solo admin)
exports.listUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id');
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear usuario por parte de admin
exports.createUserByAdmin = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: 'Faltan campos requeridos' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id', [username, email, hashed, role || 'usuario']);
    res.status(201).json({ message: 'Usuario creado', userId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Usuario o email ya existe' });
    res.status(500).json({ error: err.message });
  }
};

// Eliminar usuario por admin
exports.deleteUserByAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
