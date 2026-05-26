require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { connectDB } = require("./db");

// Rutas
const authRoutes          = require("./routes/auth");
const perfilRoutes        = require("./routes/perfil");
const cuentaRoutes        = require("./routes/cuenta");
const depositoRoutes      = require("./routes/deposito");
const retiroRoutes        = require("./routes/retiro");
const transferenciaRoutes = require("./routes/transferencia");
const cuentasDestinoRoutes = require("./routes/cuentasDestino");
const historialRoutes     = require("./routes/historial");
const bitacoraRoutes      = require("./routes/bitacora");
const eventosRoutes       = require("./routes/eventos");
const { addStatusClient } = require("./sse");

const app = express();

app.use(cors());
app.use(express.json());

// Salud
app.get("/", (req, res) => {
  res.json({ mensaje: "🏦 API Sistema de Transferencias Bancarias — activo" });
});

// ── Autenticación (pública) ──────────────────────────────
app.use("/api/auth",             authRoutes);

// ── Rutas protegidas (JWT requerido) ─────────────────────
app.use("/api/perfil",           perfilRoutes);
app.use("/api/cuenta",           cuentaRoutes);
app.use("/api/deposito",         depositoRoutes);
app.use("/api/retiro",           retiroRoutes);
app.use("/api/transferencia",    transferenciaRoutes);
app.use("/api/cuentas-destino",  cuentasDestinoRoutes);
app.use("/api/historial",        historialRoutes);
app.use("/api/bitacora",         bitacoraRoutes);

// ── SSE ──────────────────────────────────────────────────
app.get("/api/events/status", (req, res) => addStatusClient(res));
app.use("/api/events",        eventosRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor en http://0.0.0.0:${PORT}`);
      console.log("   POST /api/auth/registro");
      console.log("   POST /api/auth/login");
      console.log("   GET  /api/perfil");
      console.log("   GET  /api/cuenta/:numeroCuenta");
      console.log("   POST /api/deposito");
      console.log("   POST /api/retiro");
      console.log("   POST /api/transferencia");
      console.log("   GET  /api/cuentas-destino");
      console.log("   POST /api/cuentas-destino");
      console.log("   GET  /api/historial/:numeroCuenta");
      console.log("   GET  /api/bitacora");
    });
  })
  .catch((err) => {
    console.error("❌ No se pudo conectar a MongoDB:", err.message);
    process.exit(1);
  });
