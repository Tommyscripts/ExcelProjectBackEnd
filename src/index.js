// Punto de entrada principal
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const authRouter = require('./routers/authRouter');
const excelRouter = require('./routers/excelRouter');
const pool = require('./config/db');

app.use('/auth', authRouter);
app.use('/excel', excelRouter);

app.get('/', (req, res) => {
	res.send('API funcionando correctamente');
});

app.listen(port, () => {
	console.log(`Servidor escuchando en el puerto ${port}`);
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
		console.log('Migraciones aplicadas');
	} catch (err) {
		console.error('Error aplicando migraciones:', err.message);
	}
})();
