const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');

// Recibe datos JSON desde el frontend
router.post('/save', excelController.saveExcel);
// Devuelve el último dataset guardado
router.get('/load', excelController.loadExcel);

module.exports = router;
