const express = require('express');
const router = express.Router();
const db = require('../database');
const { verificarToken } = require('../middlewares/auth.middleware');


// ======================================================
// CREAR RESEÑA
// Solo si el usuario tuvo una reserva FINALIZADA
// ======================================================
router.post('/', verificarToken, (req, res) => {

  const { id_alojamiento, calificacion, comentario } = req.body;

  if (!id_alojamiento || !calificacion) {
    return res.status(400).json({
      error: 'El alojamiento y la calificación son obligatorios.'
    });
  }

  if (calificacion < 1 || calificacion > 5) {
    return res.status(400).json({
      error: 'La calificación debe estar entre 1 y 5.'
    });
  }

  db.get(
    `SELECT r.id
     FROM reservas r
     JOIN habitaciones h ON r.id_habitacion = h.id
     WHERE r.id_usuario = ?
       AND h.id_alojamiento = ?
       AND r.estado = 'finalizada'`,
    [req.user.id, id_alojamiento],
    (err, reservaValida) => {

      if (err) {
        return res.status(500).json({ error: 'Error verificando reserva.' });
      }

      if (!reservaValida) {
        return res.status(403).json({
          error: 'Solo puedes reseñar alojamientos donde hayas completado una reserva.'
        });
      }

      db.get(
        `SELECT id FROM reseñas
         WHERE id_usuario = ? AND id_alojamiento = ?`,
        [req.user.id, id_alojamiento],
        (err, yaExiste) => {

          if (err) {
            return res.status(500).json({
              error: 'Error verificando reseña existente.'
            });
          }

          if (yaExiste) {
            return res.status(409).json({
              error: 'Ya has dejado una reseña para este alojamiento.'
            });
          }

          db.run(
            `INSERT INTO reseñas
             (id_usuario, id_alojamiento, calificacion, comentario)
             VALUES (?, ?, ?, ?)`,
            [req.user.id, id_alojamiento, calificacion, comentario || null],
            function (err) {

              if (err) {
                return res.status(500).json({
                  error: 'Error creando reseña.'
                });
              }

              db.get(
                `SELECT AVG(calificacion) AS promedio
                 FROM reseñas
                 WHERE id_alojamiento = ?`,
                [id_alojamiento],
                (err, resultado) => {

                  if (!err && resultado) {

                    const promedio = parseFloat(resultado.promedio || 0).toFixed(2);

                    db.run(
                      `UPDATE alojamientos
                       SET calificacion_promedio = ?
                       WHERE id = ?`,
                      [promedio, id_alojamiento]
                    );
                  }
                }
              );

              res.status(201).json({
                mensaje: 'Reseña creada correctamente.',
                reseña: {
                  id: this.lastID,
                  id_usuario: req.user.id,
                  id_alojamiento,
                  calificacion,
                  comentario
                }
              });
            }
          );
        }
      );
    }
  );
});


// ======================================================
// VER TODAS LAS RESEÑAS
// ======================================================
router.get('/', (req, res) => {

  db.all(
    `SELECT 
      r.id,
      r.calificacion,
      r.comentario,
      a.nombre AS alojamiento,
      u.nombre AS usuario
     FROM reseñas r
     JOIN alojamientos a ON r.id_alojamiento = a.id
     JOIN usuarios u ON r.id_usuario = u.id`,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          error: 'Error obteniendo reseñas.'
        });
      }

      res.json(rows);
    }
  );
});


// ======================================================
// LISTAR RESEÑAS DE UN ALOJAMIENTO
// ======================================================
router.get('/alojamiento/:id', (req, res) => {

  db.all(
    `SELECT 
        r.calificacion,
        r.comentario,
        u.nombre AS usuario
     FROM reseñas r
     JOIN usuarios u ON r.id_usuario = u.id
     WHERE r.id_alojamiento = ?`,
    [req.params.id],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          error: 'Error obteniendo reseñas.'
        });
      }

      res.json(rows);
    }
  );
});

module.exports = router;