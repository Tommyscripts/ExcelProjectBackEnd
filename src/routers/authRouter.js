const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rutas abiertas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Middleware simple para comprobar role admin.
// Nota: en producción deberías usar JWT o sesiones. Aquí aceptamos un header 'x-user' con JSON del usuario autenticado (temporal).
function requireAdmin(req, res, next) {
	try {
		const raw = req.header('x-user');
		if (!raw) return res.status(401).json({ error: 'No autorizado' });
		let obj = null;
		try { obj = JSON.parse(raw); } catch (e) { return res.status(401).json({ error: 'Cabecera x-user inválida' }); }
		if (!obj || obj.role !== 'admin') return res.status(403).json({ error: 'Acceso restringido a administradores' });
		// attach user for controllers
		req.authUser = obj;
		next();
	} catch (err) {
		return res.status(401).json({ error: 'No autorizado' });
	}
}

// Rutas admin
router.get('/users', requireAdmin, authController.listUsers);
router.post('/users', requireAdmin, authController.createUserByAdmin);
router.delete('/users/:id', requireAdmin, authController.deleteUserByAdmin);

module.exports = router;
