const express = require('express');
const router = express.Router();
const { verificarToken, soloRoles } = require('../middlewares/auth.middleware');
const db = require('../database');


// ======================================================
// CREAR RESERVA
// ======================================================
router.post('/', verificarToken, (req, res) => {

  const { id_habitacion, fecha_entrada, fecha_salida } = req.body;
  const id_usuario = req.user.id;

  if (!id_habitacion || !fecha_entrada || !fecha_salida) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const entrada = new Date(fecha_entrada);
  const salida = new Date(fecha_salida);

  if (entrada >= salida) {
    return res.status(400).json({ error: 'La fecha de salida debe ser posterior.' });
  }

  const noches = Math.ceil((salida - entrada) / (1000 * 60 * 60 * 24));

  // Verificar habitación
  db.get(
    'SELECT precio FROM habitaciones WHERE id = ?',
    [id_habitacion],
    (err, habitacion) => {

      if (err) return res.status(500).json({ error: 'Error obteniendo habitación.' });
      if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada.' });

      // Verificar solapamiento
      db.get(
        `SELECT * FROM reservas
         WHERE id_habitacion = ?
         AND estado IN ('pendiente','confirmada','en_curso')
         AND fecha_entrada <= ?
         AND fecha_salida >= ?`,
        [id_habitacion, fecha_salida, fecha_entrada],
        (err, conflicto) => {

          if (err) return res.status(500).json({ error: 'Error verificando disponibilidad.' });

          if (conflicto) {
            return res.status(409).json({ error: 'La habitación ya está reservada en esas fechas.' });
          }

          const precio_total = noches * habitacion.precio;

          db.run(
            `INSERT INTO reservas
             (id_usuario,id_habitacion,fecha_entrada,fecha_salida,precio_total,estado)
             VALUES (?,?,?,?,?,'pendiente')`,
            [id_usuario,id_habitacion,fecha_entrada,fecha_salida,precio_total],
            function (err) {

              if (err) return res.status(500).json({ error: 'No se pudo crear la reserva.' });

              res.status(201).json({
                mensaje: 'Reserva creada correctamente.',
                reserva: {
                  id: this.lastID,
                  id_usuario,
                  id_habitacion,
                  fecha_entrada,
                  fecha_salida,
                  noches,
                  precio_por_noche: habitacion.precio,
                  precio_total,
                  estado: 'pendiente'
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
// VER MIS RESERVAS
// ======================================================
router.get('/mis-reservas', verificarToken, (req, res) => {

  db.all(
    `SELECT r.*, h.nombre AS habitacion
     FROM reservas r
     JOIN habitaciones h ON r.id_habitacion = h.id
     WHERE r.id_usuario = ?`,
    [req.user.id],
    (err, rows) => {

      if (err) return res.status(500).json({ error: 'Error obteniendo reservas.' });

      res.json(rows);
    }
  );

});


// ======================================================
// CANCELAR RESERVA
// ======================================================
router.put('/cancelar/:id', verificarToken, (req, res) => {

  db.run(
    `UPDATE reservas
     SET estado='cancelada'
     WHERE id=? AND id_usuario=?`,
    [req.params.id, req.user.id],
    function (err) {

      if (err) return res.status(500).json({ error: 'Error cancelando reserva.' });

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reserva no encontrada.' });
      }

      res.json({ mensaje: 'Reserva cancelada correctamente.' });
    }
  );

});


// ======================================================
// VER TODAS LAS RESERVAS (ADMIN)
// ======================================================
router.get(
  '/admin/todas',
  verificarToken,
  soloRoles('admin'),
  (req, res) => {

    db.all(
      `SELECT r.*,u.nombre AS usuario,h.nombre AS habitacion
       FROM reservas r
       JOIN usuarios u ON r.id_usuario=u.id
       JOIN habitaciones h ON r.id_habitacion=h.id`,
      [],
      (err, rows) => {

        if (err) return res.status(500).json({ error: 'Error obteniendo reservas.' });

        res.json(rows);
      }
    );

  }
);


// ======================================================
// CONFIRMAR RESERVA (ADMIN O ANFITRIÓN)
// ======================================================
router.put('/confirmar/:id', verificarToken, (req, res) => {

  db.get(
    `SELECT r.*,a.id_anfitrion
     FROM reservas r
     JOIN habitaciones h ON r.id_habitacion=h.id
     JOIN alojamientos a ON h.id_alojamiento=a.id
     WHERE r.id=?`,
    [req.params.id],
    (err,reserva)=>{

      if(err) return res.status(500).json({error:'Error buscando reserva'});
      if(!reserva) return res.status(404).json({error:'Reserva no encontrada'});

      if(req.user.rol!=='admin' && reserva.id_anfitrion!==req.user.id){
        return res.status(403).json({error:'No tienes permiso para confirmar esta reserva'});
      }

      db.run(
        `UPDATE reservas SET estado='confirmada' WHERE id=?`,
        [req.params.id],
        function(err){

          if(err) return res.status(500).json({error:'Error confirmando reserva'});

          res.json({mensaje:'Reserva confirmada correctamente'});
        }
      );
    }
  );

});


// ======================================================
// FINALIZAR RESERVA MANUALMENTE
// ======================================================
router.put(
  '/finalizar/:id',
  verificarToken,
  soloRoles('admin'),
  (req,res)=>{

    db.run(
      `UPDATE reservas
       SET estado='finalizada'
       WHERE id=?`,
      [req.params.id],
      function(err){

        if(err) return res.status(500).json({error:'Error finalizando reserva'});

        if(this.changes===0){
          return res.status(404).json({error:'Reserva no encontrada'});
        }

        res.json({
          mensaje:'Reserva finalizada correctamente'
        });

      }
    );

  }
);


// ======================================================
// FINALIZAR RESERVAS AUTOMÁTICAMENTE
// ======================================================
router.put(
  '/actualizar-estados',
  verificarToken,
  soloRoles('admin'),
  (req,res)=>{

    db.run(
      `UPDATE reservas
       SET estado='finalizada'
       WHERE fecha_salida < date('now')
       AND estado='confirmada'`,
      function(err){

        if(err) return res.status(500).json({error:'Error actualizando reservas'});

        res.json({
          mensaje:'Estados actualizados',
          reservas_actualizadas:this.changes
        });

      }
    );

  }
);

module.exports = router;