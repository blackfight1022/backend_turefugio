const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = process.env.JWT_SECRET || 'clave_super_segura';

// ===============================
// VERIFICAR TOKEN
// ===============================
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido (Bearer token).' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado.' });
    }

    // decoded contiene: { id, rol_id, rol }
    req.user = decoded;
    next();
  });
}

// ===============================
// VERIFICAR UNO O VARIOS ROLES
// ===============================
function soloRoles(...rolesPermitidos) {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    // ✅ Si el rol viene en el token lo usamos directamente (más eficiente)
    if (req.user.rol) {
      if (!rolesPermitidos.includes(req.user.rol)) {
        return res.status(403).json({ error: 'Acceso denegado para este rol.' });
      }
      return next();
    }

    // 🔎 Si no viene el rol en el token, lo consultamos en BD
    db.get(
      `SELECT r.nombre 
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [req.user.id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Error verificando rol.' });
        }

        if (!row) {
          return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        if (!rolesPermitidos.includes(row.nombre)) {
          return res.status(403).json({ error: 'Acceso denegado para este rol.' });
        }

        next();
      }
    );
  };
}

module.exports = {
  verificarToken,
  soloRoles
};