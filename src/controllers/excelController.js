const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'last_excel.json');
const ENABLE_FILE_FALLBACK = (process.env.ENABLE_FILE_FALLBACK || 'true').toLowerCase() !== 'false';

exports.saveExcel = async (req, res) => {
  console.log('========== INICIO saveExcel ==========');
  try {
    const excelData = req.body.data;
    if (!excelData) {
      return res.status(400).json({ error: 'No se recibieron datos de Excel' });
    }
    
    console.log('Datos recibidos:', typeof excelData, JSON.stringify(excelData).substring(0, 200) + '...');
    console.log('ENABLE_FILE_FALLBACK valor:', ENABLE_FILE_FALLBACK);
    
    try {
      console.log('Intentando conectar a base de datos...');
      console.log('ENABLE_FILE_FALLBACK:', ENABLE_FILE_FALLBACK);
      // PostgreSQL JSONB necesita que el dato sea serializado correctamente
      const jsonData = JSON.stringify(excelData);
      console.log('JSON serializado:', jsonData.substring(0, 100) + '...');
      await pool.query('INSERT INTO excel_data (data) VALUES ($1)', [jsonData]);
      console.log('Datos guardados exitosamente en base de datos');
      return res.json({ message: 'Datos de Excel guardados correctamente en la base de datos' });
    } catch (dbErr) {
      console.error('Error completo de base de datos:', dbErr);
      // Fallback a archivo si está habilitado
      if (ENABLE_FILE_FALLBACK) {
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
};// Devuelve el último dataset guardado
exports.loadExcel = async (req, res) => {
  try {
    try {
      const result = await pool.query('SELECT data FROM excel_data ORDER BY created_at DESC LIMIT 1');
      if (result.rows.length === 0) {
        return res.json({ data: null });
      }
      // Si el dato está almacenado como string JSON, parsearlo
      let data = result.rows[0].data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      return res.json({ data: data });
    } catch (dbErr) {
      if (ENABLE_FILE_FALLBACK) {
        try {
          if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            return res.json({ data: parsed?.data ?? null });
          }
          // Si no existe el archivo, devolver datos nulos - NO es un error
          return res.json({ data: null });
        } catch (fileErr) {
          // Incluso si hay error leyendo archivo, devolver datos nulos
          console.warn('Error leyendo archivo de fallback:', fileErr.message);
          return res.json({ data: null });
        }
      }
      return res.status(500).json({ error: dbErr.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
