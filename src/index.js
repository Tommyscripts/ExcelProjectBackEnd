// Punto de entrada principal
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Importar routers aquí cuando existan
// const userRouter = require('./routers/userRouter');
// app.use('/users', userRouter);

app.get('/', (req, res) => {
	res.send('API funcionando correctamente');
});

app.listen(port, () => {
	console.log(`Servidor escuchando en el puerto ${port}`);
});
