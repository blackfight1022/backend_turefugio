const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { verificarToken, soloRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'clave_super_segura';

// Expresión regular para validar email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// ======================================================
// REGISTRO (PÚBLICO)
// ======================================================
router.post('/register', async (req, res) => {
  try {

    let { nombre, correo, contraseña, rol } = req.body;

    // Limpiar espacios
    nombre = nombre?.trim();
    correo = correo?.trim().toLowerCase();
    contraseña = contraseña?.trim();
    rol = rol?.trim();

    // Validar campos obligatorios
    if (!nombre || !correo || !contraseña || !rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validar formato de correo
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: 'Correo electrónico inválido.' });
    }

    // Verificar que el rol exista
    db.get(
      'SELECT id FROM roles WHERE nombre = ?',
      [rol],
      async (err, rolEncontrado) => {

        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error verificando rol.' });
        }

        if (!rolEncontrado) {
          return res.status(400).json({ error: 'Rol inválido.' });
        }

        // Verificar si el correo ya está registrado
        db.get(
          'SELECT id FROM usuarios WHERE correo = ?',
          [correo],
          async (err, user) => {

            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Error en la base de datos.' });
            }

            if (user) {
              return res.status(409).json({ error: 'Este correo ya está registrado.' });
            }

            // Encriptar contraseña
            const hash = await bcrypt.hash(contraseña, 10);

            // Insertar usuario
            db.run(
              `INSERT INTO usuarios (nombre, correo, contraseña, rol_id)
               VALUES (?, ?, ?, ?)`,
              [nombre, correo, hash, rolEncontrado.id],
              function (err) {

                if (err) {
                  console.error(err);
                  return res.status(500).json({ error: 'No se pudo registrar el usuario.' });
                }

                return res.status(201).json({
                  mensaje: 'Registro exitoso.',
                  usuario: {
                    id: this.lastID,
                    nombre,
                    correo,
                    rol
                  }
                });

              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


// ======================================================
// LOGIN
// ======================================================
router.post('/login', (req, res) => {

  let { correo, contraseña } = req.body;

  // Limpiar espacios
  correo = correo?.trim().toLowerCase();
  contraseña = contraseña?.trim();

  // Validar campos
  if (!correo || !contraseña) {
    return res.status(400).json({
      error: 'Correo y contraseña son requeridos.'
    });
  }

  db.get(
    `SELECT u.id, u.nombre, u.correo, u.contraseña, u.rol_id, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.correo = ?`,
    [correo],
    async (err, user) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al buscar el usuario.' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado.' });
      }

      const match = await bcrypt.compare(contraseña, user.contraseña);

      if (!match) {
        return res.status(401).json({ error: 'Contraseña incorrecta.' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          rol_id: user.rol_id,
          rol: user.rol_nombre
        },
        SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        mensaje: 'Inicio de sesión exitoso.',
        token,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol_nombre
        }
      });

    }
  );

});


// ======================================================
// OBTENER USUARIO AUTENTICADO
// ======================================================
router.get('/me', verificarToken, (req, res) => {

  db.get(
    `SELECT u.id, u.nombre, u.correo, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.id = ?`,
    [req.user.id],
    (err, user) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error obteniendo usuario.' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      res.json(user);

    }
  );

});


// ======================================================
// OBTENER TODOS LOS USUARIOS (SOLO ADMIN)
// ======================================================
router.get(
  '/usuarios',
  verificarToken,
  soloRoles('admin'),
  (req, res) => {

    db.all(
      `SELECT u.id, u.nombre, u.correo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id`,
      [],
      (err, rows) => {

        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error obteniendo usuarios.' });
        }

        res.json(rows);

      }
    );

  }
);

module.exports = router;