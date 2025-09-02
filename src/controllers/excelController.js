const pool = require('../config/db');

exports.saveExcel = async (req, res) => {
  try {
    const excelData = req.body.data;
    if (!excelData) {
      return res.status(400).json({ error: 'No se recibieron datos de Excel' });
    }
    await pool.query('INSERT INTO excel_data (data) VALUES ($1)', [excelData]);
    res.json({ message: 'Datos de Excel guardados correctamente en la base de datos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
