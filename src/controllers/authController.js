const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
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
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta' });
    res.json({ message: 'Login exitoso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
