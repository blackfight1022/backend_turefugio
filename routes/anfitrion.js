const express = require('express');
const { verificarToken, soloRoles } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/panel', verificarToken, soloRoles('anfitrion'), (req, res) => {
  res.json({ mensaje: `Bienvenido al panel del anfitrión: ${req.user.id}` });
});

module.exports = router;
