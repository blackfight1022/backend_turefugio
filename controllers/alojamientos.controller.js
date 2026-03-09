const db = require('../database');


// ======================================================
// LISTAR TODOS LOS ALOJAMIENTOS
// ======================================================
const listarAlojamientos = (req, res) => {

  db.all(
    `SELECT a.*, u.nombre AS anfitrion
     FROM alojamientos a
     JOIN usuarios u ON a.id_anfitrion = u.id`,
    [],
    (err, rows) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error obteniendo alojamientos' });
      }

      res.json(rows);
    }
  );
};


// ======================================================
// CREAR ALOJAMIENTO (ANFITRION)
// ======================================================
const crearAlojamiento = (req, res) => {

  const { titulo, descripcion, precio, ciudad, capacidad_personas } = req.body;

  if (!titulo || !precio || !ciudad || !capacidad_personas) {
    return res.status(400).json({
      error: 'Título, precio, ciudad y capacidad de personas son obligatorios'
    });
  }

  const id_anfitrion = req.user.id;

  db.run(
    `INSERT INTO alojamientos 
    (titulo, descripcion, precio, ciudad, capacidad_personas, id_anfitrion)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [titulo, descripcion, precio, ciudad, capacidad_personas, id_anfitrion],
    function (err) {

      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'No se pudo crear el alojamiento' });
      }

      res.status(201).json({
        mensaje: 'Alojamiento creado correctamente',
        id: this.lastID
      });

    }
  );
};


// ======================================================
// BUSCAR ALOJAMIENTOS
// ======================================================
const buscarAlojamientos = (req, res) => {

  const { ciudad, personas } = req.query;

  let query = `
    SELECT a.*, u.nombre AS anfitrion
    FROM alojamientos a
    JOIN usuarios u ON a.id_anfitrion = u.id
    WHERE 1=1
  `;

  let params = [];

  if (ciudad) {
    query += ` AND a.ciudad LIKE ?`;
    params.push(`%${ciudad}%`);
  }

  if (personas) {
    query += ` AND a.capacidad_personas >= ?`;
    params.push(personas);
  }

  db.all(query, params, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error buscando alojamientos' });
    }

    res.json(rows);
  });
};


module.exports = {
  listarAlojamientos,
  crearAlojamiento,
  buscarAlojamientos
};