const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'last_excel.json');

exports.saveExcel = async (req, res) => {
  try {
    const excelData = req.body.data;
    if (!excelData) {
      return res.status(400).json({ error: 'No se recibieron datos de Excel' });
    }
    try {
      await pool.query('INSERT INTO excel_data (data) VALUES ($1)', [excelData]);
      return res.json({ message: 'Datos de Excel guardados correctamente en la base de datos' });
    } catch (dbErr) {
      // Fallback a archivo solo en desarrollo si la DB no está disponible
      const connRefused =
        dbErr?.code === 'ECONNREFUSED' ||
        /ECONNREFUSED|connect ECONNREFUSED/i.test(dbErr?.message || '');
      if (connRefused && process.env.NODE_ENV !== 'production') {
        try {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          fs.writeFileSync(DATA_FILE, JSON.stringify({ data: excelData }, null, 2), 'utf-8');
          return res.json({ message: 'Datos guardados localmente (modo archivo, sin DB)' });
        } catch (fileErr) {
          return res.status(500).json({ error: 'No se pudo guardar en archivo: ' + fileErr.message });
        }
      }
      return res.status(500).json({ error: dbErr.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Devuelve el último dataset guardado
exports.loadExcel = async (req, res) => {
  try {
    try {
      const result = await pool.query('SELECT data FROM excel_data ORDER BY created_at DESC LIMIT 1');
      if (result.rows.length === 0) {
        return res.json({ data: null });
      }
      return res.json({ data: result.rows[0].data });
    } catch (dbErr) {
      const connRefused =
        dbErr?.code === 'ECONNREFUSED' ||
        /ECONNREFUSED|connect ECONNREFUSED/i.test(dbErr?.message || '');
      if (connRefused && process.env.NODE_ENV !== 'production') {
        try {
          if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            return res.json({ data: parsed?.data ?? null });
          }
          return res.json({ data: null });
        } catch (fileErr) {
          return res.status(500).json({ error: 'No se pudo leer archivo local: ' + fileErr.message });
        }
      }
      return res.status(500).json({ error: dbErr.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
