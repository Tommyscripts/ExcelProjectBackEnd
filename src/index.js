// Punto de entrada principal
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const authRouter = require('./routers/authRouter');
const excelRouter = require('./routers/excelRouter');

app.use('/auth', authRouter);
app.use('/excel', excelRouter);

app.get('/', (req, res) => {
	res.send('API funcionando correctamente');
});

app.listen(port, () => {
	console.log(`Servidor escuchando en el puerto ${port}`);
});
