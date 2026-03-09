const express = require('express');
const db = require('../database');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = express.Router();


// ======================================================
// CREAR HABITACIÓN
// Solo admin o dueño del alojamiento
// ======================================================
router.post('/:alojamientoId', verificarToken, (req, res) => {

  const { nombre, capacidad, precio } = req.body;
  const { alojamientoId } = req.params;

  if (!nombre || !capacidad || !precio) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  db.get(
    'SELECT * FROM alojamientos WHERE id = ?',
    [alojamientoId],
    (err, alojamiento) => {

      if (err) return res.status(500).json({ error: 'Error verificando alojamiento.' });
      if (!alojamiento) return res.status(404).json({ error: 'Alojamiento no encontrado.' });

      if (req.user.rol !== 'admin' && alojamiento.id_anfitrion !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para agregar habitaciones aquí.' });
      }

      db.run(
        `INSERT INTO habitaciones (nombre, capacidad, precio, id_alojamiento)
         VALUES (?, ?, ?, ?)`,
        [nombre, capacidad, precio, alojamientoId],
        function (err) {

          if (err) return res.status(500).json({ error: 'Error creando habitación.' });

          res.status(201).json({
            mensaje: 'Habitación creada correctamente.',
            id: this.lastID
          });

        }
      );
    }
  );

});


// ======================================================
// LISTAR HABITACIONES POR ALOJAMIENTO (PÚBLICO)
// ======================================================
router.get('/alojamiento/:alojamientoId', (req, res) => {

  db.all(
    'SELECT * FROM habitaciones WHERE id_alojamiento = ?',
    [req.params.alojamientoId],
    (err, rows) => {

      if (err) return res.status(500).json({ error: 'Error obteniendo habitaciones.' });

      res.json(rows);
    }
  );

});


// ======================================================
// OBTENER HABITACIÓN POR ID
// ======================================================
router.get('/:id', (req, res) => {

  db.get(
    'SELECT * FROM habitaciones WHERE id = ?',
    [req.params.id],
    (err, row) => {

      if (err) return res.status(500).json({ error: 'Error obteniendo habitación.' });
      if (!row) return res.status(404).json({ error: 'Habitación no encontrada.' });

      res.json(row);
    }
  );

});


// ======================================================
// ACTUALIZAR HABITACIÓN
// Solo admin o dueño del alojamiento
// ======================================================
router.put('/:id', verificarToken, (req, res) => {

  const { nombre, capacidad, precio } = req.body;

  db.get(
    `SELECT h.*, a.id_anfitrion
     FROM habitaciones h
     JOIN alojamientos a ON h.id_alojamiento = a.id
     WHERE h.id = ?`,
    [req.params.id],
    (err, habitacion) => {

      if (err) return res.status(500).json({ error: 'Error buscando habitación.' });
      if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada.' });

      if (req.user.rol !== 'admin' && habitacion.id_anfitrion !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para editar esta habitación.' });
      }

      db.run(
        `UPDATE habitaciones
         SET nombre = ?, capacidad = ?, precio = ?
         WHERE id = ?`,
        [
          nombre || habitacion.nombre,
          capacidad || habitacion.capacidad,
          precio || habitacion.precio,
          req.params.id
        ],
        function (err) {

          if (err) return res.status(500).json({ error: 'Error actualizando habitación.' });

          res.json({ mensaje: 'Habitación actualizada correctamente.' });

        }
      );

    }
  );

});


// ======================================================
// ELIMINAR HABITACIÓN
// Solo admin o dueño
// ======================================================
router.delete('/:id', verificarToken, (req, res) => {

  db.get(
    `SELECT h.*, a.id_anfitrion
     FROM habitaciones h
     JOIN alojamientos a ON h.id_alojamiento = a.id
     WHERE h.id = ?`,
    [req.params.id],
    (err, habitacion) => {

      if (err) return res.status(500).json({ error: 'Error buscando habitación.' });
      if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada.' });

      if (req.user.rol !== 'admin' && habitacion.id_anfitrion !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta habitación.' });
      }

      db.run(
        'DELETE FROM habitaciones WHERE id = ?',
        [req.params.id],
        function (err) {

          if (err) return res.status(500).json({ error: 'Error eliminando habitación.' });

          res.json({ mensaje: 'Habitación eliminada correctamente.' });

        }
      );

    }
  );

});


// ======================================================
// ASIGNAR SERVICIO A UNA HABITACIÓN
// ======================================================
router.post('/:habitacionId/servicios', verificarToken, (req, res) => {

  const { habitacionId } = req.params;
  const { servicio_id } = req.body;

  if (!servicio_id) {
    return res.status(400).json({
      error: 'Debes enviar el id del servicio.'
    });
  }

  db.run(
    `INSERT INTO habitacion_servicios (habitacion_id, servicio_id)
     VALUES (?, ?)`,
    [habitacionId, servicio_id],
    function (err) {

      if (err) {
        return res.status(500).json({
          error: 'Error asignando servicio a la habitación.'
        });
      }

      res.status(201).json({
        mensaje: 'Servicio asignado correctamente a la habitación.'
      });

    }
  );

});


// ======================================================
// VER SERVICIOS DE UNA HABITACIÓN
// ======================================================
router.get('/:habitacionId/servicios', (req, res) => {

  db.all(
    `SELECT s.*
     FROM servicios s
     JOIN habitacion_servicios hs
     ON s.id = hs.servicio_id
     WHERE hs.habitacion_id = ?`,
    [req.params.habitacionId],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          error: 'Error obteniendo servicios.'
        });
      }

      res.json(rows);

    }
  );

});


module.exports = router;