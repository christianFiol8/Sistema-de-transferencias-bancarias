require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { connectDB } = require("./db");

// Rutas existentes
const cuentaRoutes    = require("./routes/cuenta");
const depositoRoutes  = require("./routes/deposito");
const retiroRoutes    = require("./routes/retiro");
const eventosRoutes   = require("./routes/eventos");
const historialRoutes = require("./routes/historial");

// Rutas nuevas - Módulo 1
const authRoutes      = require("./routes/auth");
const perfilRoutes    = require("./routes/perfil");
const { addStatusClient } = require("./sse");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta raíz
app.get("/", (req, res) => {
  res.json({ mensaje: "🏦 API Sistema de Transferencias Bancarias — activo" });
});

// ── Autenticación (pública) ──────────────────────────────
app.use("/api/auth",      authRoutes);

// ── Perfil (protegida con JWT) ───────────────────────────
app.use("/api/perfil",    perfilRoutes);

// ── Operaciones bancarias (protegidas con JWT) ───────────
app.use("/api/cuenta",    cuentaRoutes);
app.use("/api/deposito",  depositoRoutes);
app.use("/api/retiro",    retiroRoutes);
app.use("/api/historial", historialRoutes);

// ── Eventos SSE ──────────────────────────────────────────
app.get("/api/events/status", (req, res) => addStatusClient(res));
app.use("/api/events",        eventosRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
      console.log(`   POST /api/auth/registro`);
      console.log(`   POST /api/auth/login`);
      console.log(`   GET  /api/perfil`);
      console.log(`   PUT  /api/perfil`);
      console.log(`   GET  /api/cuenta/:numeroCuenta`);
      console.log(`   POST /api/deposito`);
      console.log(`   POST /api/retiro`);
      console.log(`   GET  /api/historial/:numeroCuenta`);
    });
  })
  .catch((err) => {
    console.error("❌ No se pudo conectar a MongoDB:", err.message);
    process.exit(1);
  });
