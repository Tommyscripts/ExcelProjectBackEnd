// Punto de entrada principal
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const authRouter = require('./routers/authRouter');
const excelRouter = require('./routers/excelRouter');
const pool = require('./config/db');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// En desarrollo permitimos cualquier origen para simplificar (cambiar en producción)
if (process.env.NODE_ENV === 'production') {
  app.use(cors({ origin: 'http://localhost:5173' }));
} else {
  app.use(cors());
}
app.use('/auth', authRouter);
app.use('/excel', excelRouter);

app.get('/', (req, res) => {
	res.send('API funcionando correctamente');
});

const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, () => {
  console.log(`Servidor escuchando en ${host}:${port}`);
});

server.on('error', (err) => {
  console.error('Error en el servidor:', err && err.message ? err.message : err);
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});

// Migración ligera en arranque: crear tablas si no existen
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS excel_data (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
    console.log('Migraciones aplicadas correctamente');
  // Nota: no se crean credenciales por defecto automáticamente en producción.
  // Si es necesario, crear usuarios manualmente mediante migraciones o scripts seguros.
  } catch (err) {
    // Fallar silenciosamente en desarrollo si no hay DB - el fallback a archivo está activo
    if (process.env.NODE_ENV === 'production') {
      console.error('Error aplicando migraciones:', err.message);
    } else {
      console.log('Base de datos no disponible - usando modo archivo en desarrollo');
    }
  }
})();