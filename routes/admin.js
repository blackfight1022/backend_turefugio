const express = require('express');
const db = require('../database');
const { verificarToken, soloRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/usuarios', verificarToken, soloRoles('admin'), (req, res) => {
  db.all('SELECT id, nombre, correo, rol FROM usuarios', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
