const express      = require("express");
const router       = express.Router();
const { getDB, getClient } = require("../db");
const { sendAccountUpdate } = require("../sse");
const verifyToken  = require("../middleware/verifyToken");
const { validarFormatoCuenta } = require("../utils/generarNumeroCuenta");
const { ObjectId } = require("mongodb");

// ---------------------------------------------------------------------------
// POST /api/transferencia
// Transfiere fondos entre dos cuentas de forma atómica (ACID con sesión MongoDB)
// Requiere JWT en el header Authorization
// ---------------------------------------------------------------------------
router.post("/", verifyToken, async (req, res) => {
  const session = getClient().startSession();

  try {
    const db = getDB();
    const { cuentaDestino, monto, mensaje } = req.body;
    const numeroCuentaOrigen = req.usuario.numeroCuenta;

    // ── Validación de formato ─────────────────────────────────────────────
    if (!cuentaDestino || !validarFormatoCuenta(cuentaDestino)) {
      return res.status(400).json({
        ok: false,
        error: "El número de cuenta destino debe tener exactamente 10 dígitos numéricos."
      });
    }

    if (cuentaDestino === numeroCuentaOrigen) {
      return res.status(400).json({
        ok: false,
        error: "No puedes transferir a tu propia cuenta."
      });
    }

    const montoNum = Number(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        ok: false,
        error: "El monto debe ser un número mayor a cero."
      });
    }

    let transaccionId;

    await session.withTransaction(async () => {
      // 1. Verificar y descontar cuenta origen con condición atómica de saldo
      const origen = await db.collection("cuentas").findOneAndUpdate(
        {
          numeroCuenta: numeroCuentaOrigen,
          estatus: "activa",
          saldo: { $gte: montoNum }
        },
        { $inc: { saldo: -montoNum } },
        { returnDocument: "after", session }
      );

      if (!origen) {
        throw Object.assign(new Error("Saldo insuficiente o cuenta origen inactiva."), { statusCode: 400 });
      }

      // 2. Abonar cuenta destino
      const destino = await db.collection("cuentas").findOneAndUpdate(
        { numeroCuenta: cuentaDestino, estatus: "activa" },
        { $inc: { saldo: montoNum } },
        { returnDocument: "after", session }
      );

      if (!destino) {
        throw Object.assign(new Error("La cuenta destino no existe o no está activa."), { statusCode: 404 });
      }

      const ahora = new Date();

      // 3. Registrar transacción en cuenta origen
      await db.collection("transacciones").insertOne({
        cuentaId:       origen._id,
        tipo:           "transferencia_enviada",
        monto:          montoNum,
        fecha:          ahora,
        descripcion:    mensaje || "Transferencia enviada",
        cuentaDestino,
        saldoPosterior: origen.saldo
      }, { session });

      // 4. Registrar transacción en cuenta destino
      const txDestino = await db.collection("transacciones").insertOne({
        cuentaId:       destino._id,
        tipo:           "transferencia_recibida",
        monto:          montoNum,
        fecha:          ahora,
        descripcion:    mensaje || "Transferencia recibida",
        cuentaOrigen:   numeroCuentaOrigen,
        saldoPosterior: destino.saldo
      }, { session });

      transaccionId = txDestino.insertedId;

      // 5. Bitácora (Origen - Transferencia Aprobada)
      await db.collection("bitacora").insertOne({
        fecha:     ahora,
        usuarioId: new ObjectId(req.usuario.id),
        accion:    "transferencia aprobada",
        estado:    "exitoso",
        detalle: {
          cuentaOrigen:  numeroCuentaOrigen,
          cuentaDestino,
          monto:         montoNum,
          mensaje:       mensaje || ""
        }
      }, { session });

      // 5b. Bitácora (Destino - Transferencia Aceptada)
      await db.collection("bitacora").insertOne({
        fecha:     ahora,
        usuarioId: destino.clienteId,
        accion:    "transferencia aceptada",
        estado:    "exitoso",
        detalle: {
          cuentaOrigen:  numeroCuentaOrigen,
          cuentaDestino,
          monto:         montoNum,
          mensaje:       mensaje || ""
        }
      }, { session });

      // 6. Notificar via SSE
      sendAccountUpdate(numeroCuentaOrigen, {
        tipo: "transferencia_enviada",
        numeroCuenta: numeroCuentaOrigen,
        monto: montoNum,
        saldoActual: origen.saldo,
        fecha: ahora
      });

      sendAccountUpdate(cuentaDestino, {
        tipo: "transferencia_recibida",
        numeroCuenta: cuentaDestino,
        monto: montoNum,
        saldoActual: destino.saldo,
        fecha: ahora
      });
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Transferencia realizada correctamente.",
      transaccionId,
      cuentaOrigen:  numeroCuentaOrigen,
      cuentaDestino,
      monto:         montoNum
    });

  } catch (error) {
    // Intentar registrar fallo en bitácora
    try {
      const db = getDB();
      await db.collection("bitacora").insertOne({
        fecha:     new Date(),
        usuarioId: req.usuario?.id ? new ObjectId(req.usuario.id) : null,
        accion:    "transferencia fallida",
        estado:    "fallido",
        detalle: {
          cuentaOrigen:  req.usuario?.numeroCuenta,
          cuentaDestino: req.body?.cuentaDestino,
          monto:         req.body?.monto,
          error:         error.message
        }
      });
    } catch (_) {}

    console.error("Error en POST /api/transferencia", error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Error interno del servidor."
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
