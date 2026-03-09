const express = require('express');
const db = require('../database');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = express.Router();


// ==========================================
// REGISTRAR PAGO DE UNA RESERVA
// ==========================================
router.post(
  '/',
  verificarToken,
  (req, res) => {

    const { id_reserva, monto, metodo_pago } = req.body;

    if (!id_reserva || !monto || !metodo_pago) {
      return res.status(400).json({
        error: 'Debe enviar id_reserva, monto y metodo_pago'
      });
    }

    const referencia = "PAY-" + Date.now();

    db.run(
      `INSERT INTO pagos
       (id_reserva, monto, metodo_pago, estado, referencia_pago)
       VALUES (?, ?, ?, 'pagado', ?)`,
      [
        id_reserva,
        monto,
        metodo_pago,
        referencia
      ],
      function (err) {

        if (err) {
          return res.status(500).json({
            error: 'Error registrando pago'
          });
        }

        res.status(201).json({
          mensaje: 'Pago registrado correctamente',
          referencia_pago: referencia
        });
      }
    );
  }
);


// ==========================================
// VER PAGOS DE UNA RESERVA
// ==========================================
router.get(
  '/reserva/:id',
  verificarToken,
  (req, res) => {

    const { id } = req.params;

    db.all(
      `SELECT * FROM pagos
       WHERE id_reserva = ?`,
      [id],
      (err, rows) => {

        if (err) {
          return res.status(500).json({
            error: 'Error obteniendo pagos'
          });
        }

        res.status(200).json(rows);
      }
    );
  }
);


// ==========================================
// VER TODOS LOS PAGOS
// ==========================================
router.get(
  '/',
  verificarToken,
  (req, res) => {

    db.all(
      `SELECT 
        p.id,
        p.id_reserva,
        p.monto,
        p.metodo_pago,
        p.estado,
        p.referencia_pago,
        r.id_usuario
       FROM pagos p
       JOIN reservas r ON p.id_reserva = r.id`,
      [],
      (err, rows) => {

        if (err) {
          return res.status(500).json({
            error: 'Error obteniendo pagos'
          });
        }

        res.status(200).json(rows);
      }
    );
  }
);


module.exports = router;