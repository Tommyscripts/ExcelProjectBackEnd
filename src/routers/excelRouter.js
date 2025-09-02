const express = require('express');
const router = express.Router();
const multer = require('multer');
const excelController = require('../controllers/excelController');

const upload = multer({ dest: 'uploads/' });

router.post('/save', upload.single('excel'), excelController.saveExcel);

module.exports = router;
