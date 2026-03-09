const db = require('../database');


// ===============================
// LISTAR SERVICIOS
// ===============================
const listarServicios = (req, res) => {

  db.all("SELECT * FROM servicios", [], (err, rows) => {

    if (err) {
      return res.status(500).json({
        error: "Error obteniendo servicios"
      });
    }

    res.json(rows);

  });

};


// ===============================
// CREAR SERVICIO
// ===============================
const crearServicio = (req, res) => {

  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({
      error: "El nombre del servicio es obligatorio"
    });
  }

  db.run(
    "INSERT INTO servicios (nombre) VALUES (?)",
    [nombre],
    function (err) {

      if (err) {
        return res.status(500).json({
          error: "Error creando servicio"
        });
      }

      res.json({
        mensaje: "Servicio creado correctamente",
        id: this.lastID
      });

    }
  );

};


module.exports = {
  listarServicios,
  crearServicio
};