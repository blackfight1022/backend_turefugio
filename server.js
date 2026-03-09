// ===============================
// CARGAR VARIABLES DE ENTORNO (PRIMERO)
// ===============================
require('dotenv').config();

// ===============================
// IMPORTACIONES
// ===============================
const express = require('express');
const cors = require('cors');

// RUTAS
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin');
const anfitrionRoutes = require('./routes/anfitrion');
const visitanteRoutes = require('./routes/visitante');
const alojamientosRoutes = require('./routes/alojamientos');
const habitacionesRoutes = require('./routes/habitaciones');
const reservasRoutes = require('./routes/reservas');
const resenasRoutes = require('./routes/resenas');

// NUEVAS RUTAS
const servicesRoutes = require('./routes/services.routes');
const paymentsRoutes = require('./routes/payments.routes');

// ===============================
// INICIALIZACIÓN
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARES
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carpeta pública (imágenes por ejemplo)
app.use(express.static('public'));


// ===============================
// RUTA BASE DE PRUEBA
// ===============================
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'OK',
    mensaje: 'API Tu Refugio funcionando correctamente 🚀'
  });
});


// ===============================
// RUTAS PRINCIPALES
// ===============================
app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/anfitrion', anfitrionRoutes);

app.use('/api/visitante', visitanteRoutes);

app.use('/api/alojamientos', alojamientosRoutes);

app.use('/api/habitaciones', habitacionesRoutes);

app.use('/api/reservas', reservasRoutes);

app.use('/api/resenas', resenasRoutes);


// ===============================
// NUEVAS FUNCIONALIDADES
// ===============================

// Servicios del alojamiento
app.use('/api/services', servicesRoutes);

// Pagos electrónicos
app.use('/api/payments', paymentsRoutes);


// ===============================
// RUTA NO ENCONTRADA (404)
// ===============================
app.use((req, res) => {
  res.status(404).json({
    status: 'ERROR',
    mensaje: 'Ruta no encontrada'
  });
});


// ===============================
// MANEJO GLOBAL DE ERRORES (500)
// ===============================
app.use((err, req, res, next) => {

  console.error('🔥 Error detectado:', err.message);

  res.status(500).json({
    status: 'ERROR',
    mensaje: 'Error interno del servidor'
  });

});


// ===============================
// INICIAR SERVIDOR
// ===============================
app.listen(PORT, () => {

  console.log(`
====================================
🚀 Servidor Tu Refugio activo
📍 http://localhost:${PORT}
📡 API: http://localhost:${PORT}/api
====================================
  `);

});