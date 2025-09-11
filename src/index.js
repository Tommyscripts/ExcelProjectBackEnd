// Punto de entrada principal
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies and x-www-form-urlencoded forms (some clients post form-encoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Graceful handler for invalid JSON bodies produced by clients.
// body-parser will pass a SyntaxError / entity.parse.failed here — catch it and reply 400.
app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === 'entity.parse.failed')) {
    console.warn('Body parse error on', req.method, req.path, 'content-type:', req.headers['content-type']);
    return res.status(400).json({ error: 'JSON inválido o body malformado' });
  }
  next(err);
});

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

const net = require('net');

function isPortInUse(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let called = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      called = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      if (!called) {
        called = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once('error', (err) => {
      if (!called) {
        called = true;
        // ECONNREFUSED -> libre, otros errores -> asumir libre
        resolve(false);
      }
    });
    socket.connect(port, host);
  });
}

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});

// Arranque controlado: comprobar puerto primero para evitar múltiples bindings
(async () => {
  try {
    const inUse = await isPortInUse(host, port);
    if (inUse) {
      // Intentar identificar el/los PID(s) que ocupan el puerto y reportarlos
      try {
        const { execSync } = require('child_process');
        let out = '';
        try {
          out = execSync(`lsof -i :${port} -sTCP:LISTEN -Pn -t`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
        } catch (e) {
          // lsof puede no estar disponible; intentamos ss como fallback
          try {
            out = execSync(`ss -ltnp | grep :${port} | awk -F'pid=' '{print $2}' | cut -d',' -f1`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
          } catch (e2) {
            out = '';
          }
        }

        if (out) {
          const pids = out.split(/\s+/).filter(Boolean);
          for (const pid of pids) {
            try {
              const info = execSync(`ps -p ${pid} -o pid= -o cmd=`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
              console.log(`Puerto ${host}:${port} en uso por: ${info}`);
            } catch (e) {
              console.log(`Puerto ${host}:${port} en uso por PID ${pid}`);
            }
          }
        } else {
          console.log(`Puerto ${host}:${port} ya en uso. No se pudo identificar PID (lsof/ss no disponibles).`);
        }
      } catch (err) {
        console.log(`Puerto ${host}:${port} ya en uso. (error al identificar PID: ${err && err.message ? err.message : err})`);
      }
      process.exit(0);
    }

    // Migración ligera en arranque: crear tablas si no existen
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`);
      // Asegurarse de que la columna `role` existe (valor por defecto 'usuario')
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'usuario';`);
      await pool.query(`CREATE TABLE IF NOT EXISTS excel_data (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`);
      console.log('Migraciones aplicadas correctamente');
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.error('Error aplicando migraciones:', err.message);
      } else {
        console.log('Base de datos no disponible - usando modo archivo en desarrollo');
      }
    }

    const server = app.listen(port, host, () => {
      console.log(`Servidor escuchando en ${host}:${port}`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Error: puerto ${host}:${port} en uso (EADDRINUSE). Saliendo.`);
        process.exit(0);
      }
      console.error('Error en el servidor:', err && err.message ? err.message : err);
    });
  } catch (err) {
    console.error('Error en arranque:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();