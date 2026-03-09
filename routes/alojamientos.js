const express = require('express');
const db = require('../database');
const { verificarToken, soloRoles } = require('../middlewares/auth.middleware');

const router = express.Router();


// ======================================================
// CREAR ALOJAMIENTO
// Solo ADMIN o ANFITRION
// ======================================================
router.post(
  '/',
  verificarToken,
  soloRoles('admin', 'anfitrion'),
  (req, res) => {

    const { titulo, descripcion, ubicacion, imagen, precio, capacidad_personas } = req.body;

    if (!titulo || !precio || !capacidad_personas) {
      return res.status(400).json({
        error: 'Título, precio y capacidad de personas son obligatorios.'
      });
    }

    db.run(
      `INSERT INTO alojamientos 
       (titulo, descripcion, ubicacion, imagen, precio, capacidad_personas, id_anfitrion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        descripcion || null,
        ubicacion || null,
        imagen || null,
        precio,
        capacidad_personas,
        req.user.id
      ],
      function (err) {

        if (err) {
          console.error("Error DB:", err);
          return res.status(500).json({
            error: 'Error creando alojamiento.'
          });
        }

        res.status(201).json({
          mensaje: 'Alojamiento creado correctamente.',
          id: this.lastID
        });
      }
    );
  }
);


// ======================================================
// LISTAR TODOS LOS ALOJAMIENTOS
// RUTA PUBLICA
// ======================================================
router.get('/', (req, res) => {

  db.all(
    `SELECT a.*, u.nombre AS anfitrion
     FROM alojamientos a
     JOIN usuarios u ON a.id_anfitrion = u.id`,
    [],
    (err, rows) => {

      if (err) {
        console.error("Error DB:", err);
        return res.status(500).json({
          error: 'Error obteniendo alojamientos.'
        });
      }

      res.status(200).json(rows);
    }
  );
});


// ======================================================
// BUSCAR ALOJAMIENTOS
// ======================================================
router.get('/buscar', (req, res) => {

  const { ciudad, personas, precio_max } = req.query;

  let query = `
    SELECT a.*, u.nombre AS anfitrion
    FROM alojamientos a
    JOIN usuarios u ON a.id_anfitrion = u.id
    WHERE 1=1
  `;

  let params = [];

  if (ciudad) {
    query += ` AND a.ubicacion LIKE ?`;
    params.push(`%${ciudad}%`);
  }

  if (personas) {
    query += ` AND a.capacidad_personas >= ?`;
    params.push(personas);
  }

  if (precio_max) {
    query += ` AND a.precio <= ?`;
    params.push(precio_max);
  }

  db.all(query, params, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Error buscando alojamientos.'
      });
    }

    res.status(200).json(rows);
  });
});


// ======================================================
// OBTENER ALOJAMIENTO POR ID
// ======================================================
router.get('/:id', (req, res) => {

  const { id } = req.params;

  db.get(
    `SELECT a.*, u.nombre AS anfitrion
     FROM alojamientos a
     JOIN usuarios u ON a.id_anfitrion = u.id
     WHERE a.id = ?`,
    [id],
    (err, row) => {

      if (err) {
        console.error("Error DB:", err);
        return res.status(500).json({
          error: 'Error obteniendo alojamiento.'
        });
      }

      if (!row) {
        return res.status(404).json({
          error: 'Alojamiento no encontrado.'
        });
      }

      res.status(200).json(row);
    }
  );
});


// ======================================================
// ACTUALIZAR ALOJAMIENTO
// ======================================================
router.put(
  '/:id',
  verificarToken,
  (req, res) => {

    const { id } = req.params;
    const { titulo, descripcion, ubicacion, imagen, precio, capacidad_personas } = req.body;

    db.get(
      'SELECT * FROM alojamientos WHERE id = ?',
      [id],
      (err, alojamiento) => {

        if (err) {
          return res.status(500).json({
            error: 'Error buscando alojamiento.'
          });
        }

        if (!alojamiento) {
          return res.status(404).json({
            error: 'Alojamiento no encontrado.'
          });
        }

        if (req.user.rol !== 'admin' && alojamiento.id_anfitrion !== req.user.id) {
          return res.status(403).json({
            error: 'No tienes permiso para editar este alojamiento.'
          });
        }

        db.run(
          `UPDATE alojamientos
           SET titulo = ?, descripcion = ?, ubicacion = ?, imagen = ?, precio = ?, capacidad_personas = ?
           WHERE id = ?`,
          [
            titulo || alojamiento.titulo,
            descripcion || alojamiento.descripcion,
            ubicacion || alojamiento.ubicacion,
            imagen || alojamiento.imagen,
            precio || alojamiento.precio,
            capacidad_personas || alojamiento.capacidad_personas,
            id
          ],
          function (err) {

            if (err) {
              return res.status(500).json({
                error: 'Error actualizando alojamiento.'
              });
            }

            res.status(200).json({
              mensaje: 'Alojamiento actualizado correctamente.'
            });
          }
        );
      }
    );
  }
);


// ======================================================
// ELIMINAR ALOJAMIENTO
// ======================================================
router.delete(
  '/:id',
  verificarToken,
  (req, res) => {

    const { id } = req.params;

    db.get(
      'SELECT * FROM alojamientos WHERE id = ?',
      [id],
      (err, alojamiento) => {

        if (err) {
          return res.status(500).json({
            error: 'Error buscando alojamiento.'
          });
        }

        if (!alojamiento) {
          return res.status(404).json({
            error: 'Alojamiento no encontrado.'
          });
        }

        if (req.user.rol !== 'admin' && alojamiento.id_anfitrion !== req.user.id) {
          return res.status(403).json({
            error: 'No tienes permiso para eliminar este alojamiento.'
          });
        }

        db.run(
          'DELETE FROM alojamientos WHERE id = ?',
          [id],
          function (err) {

            if (err) {
              return res.status(500).json({
                error: 'Error eliminando alojamiento.'
              });
            }

            res.status(200).json({
              mensaje: 'Alojamiento eliminado correctamente.'
            });
          }
        );
      }
    );
  }
);

module.exports = router;