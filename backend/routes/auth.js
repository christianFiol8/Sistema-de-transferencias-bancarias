const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { getDB, getClient } = require("../db");
const { generarNumeroCuenta, validarFormatoCuenta } = require("../utils/generarNumeroCuenta");

// ---------------------------------------------------------------------------
// POST /api/auth/registro
// Crea un nuevo cliente y le asigna automáticamente un número de cuenta
// ---------------------------------------------------------------------------
router.post("/registro", async (req, res) => {
  const session = getClient().startSession();

  try {
    const db = getDB();
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      correo,
      contrasena,
      telefono,
      curp
    } = req.body;

    // ── Validaciones básicas ──────────────────────────────────────────────
const camposRequeridos = { nombre, apellidoPaterno, correo, contrasena, telefono, curp };
    for (const [campo, valor] of Object.entries(camposRequeridos)) {
      if (!valor || !String(valor).trim()) {
        return res.status(400).json({
          ok: false,
          error: `El campo '${campo}' es obligatorio.`
        });
      }
    }

    if (contrasena.length < 8) {
      return res.status(400).json({
        ok: false,
        error: "La contraseña debe tener al menos 8 caracteres."
      });
    }

    const correoLimpio = correo.trim().toLowerCase();
    const curpLimpio   = curp.trim().toUpperCase();

    // ── Verificar duplicados ────────────────────────────────────────────
    const correoExiste = await db.collection("clientes").findOne({ correo: correoLimpio });
    if (correoExiste) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe una cuenta registrada con ese correo electrónico."
      });
    }

    const curpExiste = await db.collection("clientes").findOne({ curp: curpLimpio });
    if (curpExiste) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe una cuenta registrada con esa CURP."
      });
    }

    // ── Encriptar contraseña ───────────────────────────────────────────
    const hash = await bcrypt.hash(contrasena, 12);

    // ── Obtener el siguiente ID secuencial ──────────────────────────────
    // Se usa un contador atómico en la colección 'contadores' para evitar
    // condiciones de carrera en registros simultáneos
    const contadorDoc = await db.collection("contadores").findOneAndUpdate(
      { _id: "clienteId" },
      { $inc: { secuencia: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const idSecuencial = contadorDoc.secuencia;

    // ── Generar número de cuenta ─────────────────────────────────────────
    const numeroCuenta = generarNumeroCuenta(idSecuencial);

    // ── Insertar cliente y cuenta en transacción atómica ─────────────────
    let clienteId, cuentaId;

    await session.withTransaction(async () => {
      // 1. Insertar cliente
      const resultCliente = await db.collection("clientes").insertOne({
        nombre:          nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno?.trim() || "",
        correo:          correoLimpio,
        contrasena:      hash,
        telefono:        telefono.trim(),
        curp:            curpLimpio,
        idSecuencial,
        fechaRegistro:   new Date()
      }, { session });

      clienteId = resultCliente.insertedId;

      // 2. Insertar cuenta bancaria
      const resultCuenta = await db.collection("cuentas").insertOne({
        clienteId,
        numeroCuenta,
        tipoCuenta:    "debito",
        saldo:         1000,
        moneda:        "MXN",
        fechaApertura: new Date(),
        estatus:       "activa"
      }, { session });

      cuentaId = resultCuenta.insertedId;

      // 3. Registrar en bitácora
      await db.collection("bitacora").insertOne({
        fecha:     new Date(),
        usuarioId: clienteId,
        accion:    "alta de cuenta",
        estado:    "exitoso",
        detalle:   { numeroCuenta, idSecuencial }
      }, { session });
    });

    // ── Generar token JWT ───────────────────────────────────────────────
    const token = jwt.sign(
      { id: clienteId, correo: correoLimpio, numeroCuenta },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.status(201).json({
      ok: true,
      mensaje:      "Usuario registrado correctamente.",
      numeroCuenta,
      token
    });

  } catch (error) {
    // Registrar fallo en bitácora si es posible
    try {
      const db = getDB();
      await db.collection("bitacora").insertOne({
        fecha:     new Date(),
        usuarioId: null,
        accion:    "alta de cuenta",
        estado:    "fallido",
        detalle:   { error: error.message }
      });
    } catch (_) {}

    console.error("Error en POST /api/auth/registro", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor.",
      detalle: error.message
    });
  } finally {
    await session.endSession();
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Autentica al usuario y devuelve un token JWT
// ---------------------------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const db = getDB();
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        ok: false,
        error: "Correo y contraseña son obligatorios."
      });
    }

    const correoLimpio = correo.trim().toLowerCase();

    // Buscar cliente
    const cliente = await db.collection("clientes").findOne({ correo: correoLimpio });

    // Registro en bitácora de intento fallido (usuario no existe)
    if (!cliente) {
      await db.collection("bitacora").insertOne({
        fecha:     new Date(),
        usuarioId: null,
        accion:    "login fallido",
        estado:    "fallido",
        detalle:   { correo: correoLimpio, motivo: "Usuario no encontrado" }
      });
      return res.status(401).json({
        ok: false,
        error: "Credenciales incorrectas."
      });
    }

    // Verificar contraseña
    const contrasenaValida = await bcrypt.compare(contrasena, cliente.contrasena);

    if (!contrasenaValida) {
      await db.collection("bitacora").insertOne({
        fecha:     new Date(),
        usuarioId: cliente._id,
        accion:    "login fallido",
        estado:    "fallido",
        detalle:   { correo: correoLimpio, motivo: "Contraseña incorrecta" }
      });
      return res.status(401).json({
        ok: false,
        error: "Credenciales incorrectas."
      });
    }

    // Obtener cuenta del cliente
    const cuenta = await db.collection("cuentas").findOne({ clienteId: cliente._id });

    if (!cuenta || cuenta.estatus !== "activa") {
      return res.status(403).json({
        ok: false,
        error: "La cuenta asociada no está activa."
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: cliente._id, correo: cliente.correo, numeroCuenta: cuenta.numeroCuenta },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    // Registrar login exitoso en bitácora
    await db.collection("bitacora").insertOne({
      fecha:     new Date(),
      usuarioId: cliente._id,
      accion:    "login exitoso",
      estado:    "exitoso",
      detalle:   { correo: correoLimpio, numeroCuenta: cuenta.numeroCuenta }
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        nombre:          cliente.nombre,
        apellidoPaterno: cliente.apellidoPaterno,
        apellidoMaterno: cliente.apellidoMaterno,
        correo:          cliente.correo,
        numeroCuenta:    cuenta.numeroCuenta,
        saldo:           cuenta.saldo
      }
    });

  } catch (error) {
    console.error("Error en POST /api/auth/login", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor.",
      detalle: error.message
    });
  }
});

module.exports = router;
