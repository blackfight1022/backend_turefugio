const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// =====================================
// RUTA DE LA BASE DE DATOS
// =====================================
const dbPath = path.resolve(__dirname, 'database.sqlite');

// =====================================
// CREAR CONEXIÓN
// =====================================
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a SQLite correctamente.');
  }
});

// Activar claves foráneas
db.run('PRAGMA foreign_keys = ON');

// =====================================
// CREACIÓN DE TABLAS
// =====================================
db.serialize(() => {

  // ===============================
  // TABLA ROLES
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO roles (id, nombre) VALUES
    (1, 'admin'),
    (2, 'anfitrion'),
    (3, 'visitante')
  `);


  // ===============================
  // TABLA USUARIOS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT UNIQUE NOT NULL,
      contraseña TEXT NOT NULL,
      rol_id INTEGER NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rol_id) REFERENCES roles(id)
    )
  `);


  // ===============================
  // TABLA ALOJAMIENTOS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS alojamientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      ubicacion TEXT,
      imagen TEXT,
      precio REAL NOT NULL,
      capacidad_personas INTEGER NOT NULL,
      calificacion_promedio REAL DEFAULT 0,
      id_anfitrion INTEGER NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_anfitrion) REFERENCES usuarios(id)
    )
  `);


  // ===============================
  // TABLA HABITACIONES
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS habitaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      capacidad INTEGER NOT NULL,
      precio REAL NOT NULL,
      id_alojamiento INTEGER NOT NULL,
      FOREIGN KEY (id_alojamiento) REFERENCES alojamientos(id) ON DELETE CASCADE
    )
  `);


  // ===============================
  // TABLA SERVICIOS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL
    )
  `);


  // ===============================
  // SERVICIOS INICIALES
  // ===============================
  db.run(`
    INSERT OR IGNORE INTO servicios (id, nombre) VALUES
    (1,'WiFi'),
    (2,'Piscina'),
    (3,'Parqueadero'),
    (4,'Desayuno'),
    (5,'Aire acondicionado'),
    (6,'Mascotas permitidas'),
    (7,'TV'),
    (8,'Cocina'),
    (9,'Lavadora'),
    (10,'Jacuzzi')
  `);


  // ===============================
  // RELACIÓN ALOJAMIENTO - SERVICIOS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS alojamiento_servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_alojamiento INTEGER NOT NULL,
      id_servicio INTEGER NOT NULL,

      FOREIGN KEY (id_alojamiento)
      REFERENCES alojamientos(id)
      ON DELETE CASCADE,

      FOREIGN KEY (id_servicio)
      REFERENCES servicios(id)
      ON DELETE CASCADE
    )
  `);


  // ===============================
  // RELACIÓN HABITACION - SERVICIOS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS habitacion_servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_habitacion INTEGER NOT NULL,
      id_servicio INTEGER NOT NULL,

      FOREIGN KEY (id_habitacion)
      REFERENCES habitaciones(id)
      ON DELETE CASCADE,

      FOREIGN KEY (id_servicio)
      REFERENCES servicios(id)
      ON DELETE CASCADE
    )
  `);


  // ===============================
  // TABLA RESERVAS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      id_habitacion INTEGER NOT NULL,
      id_usuario INTEGER NOT NULL,

      fecha_entrada TEXT NOT NULL,
      fecha_salida TEXT NOT NULL,

      personas INTEGER DEFAULT 1,

      precio_total REAL NOT NULL,

      estado TEXT CHECK(
        estado IN (
          'pendiente',
          'confirmada',
          'cancelada',
          'en_curso',
          'finalizada'
        )
      ) DEFAULT 'pendiente',

      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (id_habitacion)
      REFERENCES habitaciones(id)
      ON DELETE CASCADE,

      FOREIGN KEY (id_usuario)
      REFERENCES usuarios(id)
      ON DELETE CASCADE
    )
  `);


  // ===============================
  // ÍNDICE PARA RESERVAS
  // ===============================
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_reservas_habitacion
    ON reservas (id_habitacion, fecha_entrada, fecha_salida)
  `);


  // ===============================
  // TABLA PAGOS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      id_reserva INTEGER NOT NULL,

      monto REAL NOT NULL,

      metodo_pago TEXT CHECK(
        metodo_pago IN (
          'tarjeta',
          'nequi',
          'daviplata',
          'pse'
        )
      ) NOT NULL,

      estado TEXT CHECK(
        estado IN (
          'pendiente',
          'pagado',
          'rechazado'
        )
      ) DEFAULT 'pendiente',

      referencia_pago TEXT,

      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (id_reserva)
      REFERENCES reservas(id)
      ON DELETE CASCADE
    )
  `);


  // ===============================
  // TABLA RESEÑAS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS reseñas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      id_usuario INTEGER NOT NULL,
      id_alojamiento INTEGER NOT NULL,

      calificacion INTEGER CHECK(calificacion BETWEEN 1 AND 5),
      comentario TEXT,

      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (id_usuario)
      REFERENCES usuarios(id)
      ON DELETE CASCADE,

      FOREIGN KEY (id_alojamiento)
      REFERENCES alojamientos(id)
      ON DELETE CASCADE
    )
  `);

  console.log('🚀 Base de datos creada con SERVICIOS, HABITACIONES y PAGOS correctamente.');

});

module.exports = db;