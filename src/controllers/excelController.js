const path = require('path');
const fs = require('fs');

exports.saveExcel = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  const filePath = path.join(__dirname, '../../ExcelBack/general.xlsx');
  fs.rename(req.file.path, filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Error al guardar el archivo' });
    res.json({ message: 'Archivo Excel guardado correctamente' });
  });
};
