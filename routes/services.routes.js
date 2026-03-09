const express = require('express');
const router = express.Router();
const db = require('../database');


// ======================================
// LISTAR TODOS LOS SERVICIOS
// ======================================
router.get('/', (req, res) => {

  db.all(
    "SELECT * FROM servicios ORDER BY nombre",
    [],
    (err, rows) => {

      if (err) {
        console.error(err);
        return res.status(500).json({
          error: "Error obteniendo servicios"
        });
      }

      res.json(rows);

    }
  );

});


// ======================================
// OBTENER UN SERVICIO POR ID
// ======================================
router.get('/:id', (req, res) => {

  const { id } = req.params;

  db.get(
    "SELECT * FROM servicios WHERE id = ?",
    [id],
    (err, row) => {

      if (err) {
        console.error(err);
        return res.status(500).json({
          error: "Error obteniendo servicio"
        });
      }

      if (!row) {
        return res.status(404).json({
          error: "Servicio no encontrado"
        });
      }

      res.json(row);

    }
  );

});


// ======================================
// CREAR SERVICIO
// ======================================
router.post('/', (req, res) => {

  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({
      error: "El nombre del servicio es obligatorio"
    });
  }

  db.run(
    `INSERT INTO servicios (nombre) VALUES (?)`,
    [nombre],
    function (err) {

      if (err) {
        console.error(err);
        return res.status(500).json({
          error: "Error creando servicio"
        });
      }

      res.status(201).json({
        mensaje: "Servicio creado correctamente",
        id: this.lastID
      });

    }
  );

});


// ======================================
// ACTUALIZAR SERVICIO
// ======================================
router.put('/:id', (req, res) => {

  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({
      error: "El nombre del servicio es obligatorio"
    });
  }

  db.run(
    `UPDATE servicios
     SET nombre = ?
     WHERE id = ?`,
    [nombre, id],
    function (err) {

      if (err) {
        console.error(err);
        return res.status(500).json({
          error: "Error actualizando servicio"
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: "Servicio no encontrado"
        });
      }

      res.json({
        mensaje: "Servicio actualizado correctamente"
      });

    }
  );

});


// ======================================
// ELIMINAR SERVICIO
// ======================================
router.delete('/:id', (req, res) => {

  const { id } = req.params;

  db.run(
    "DELETE FROM servicios WHERE id = ?",
    [id],
    function (err) {

      if (err) {
        console.error(err);
        return res.status(500).json({
          error: "Error eliminando servicio"
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: "Servicio no encontrado"
        });
      }

      res.json({
        mensaje: "Servicio eliminado correctamente"
      });

    }
  );

});


module.exports = router;