const express     = require("express");
const router      = express.Router();
const { getDB, getClient } = require("../db");
const verifyToken = require("../middleware/verifyToken");
const { sendAccountUpdate } = require("../sse");
const { validarFormatoCuenta } = require("../utils/generarNumeroCuenta");
const { ObjectId } = require("mongodb");

// POST /api/retiro  (protegida con JWT)
router.post("/", verifyToken, async (req, res) => {
  const session = getClient().startSession();

  try {
    const db = getDB();
    const { numeroCuenta, monto, descripcion, sucursal } = req.body;

    // ── Validaciones previas a la transacción ─────────────────────────────
    if (!numeroCuenta || typeof numeroCuenta !== "string" || !numeroCuenta.trim()) {
      return res.status(400).json({ ok: false, error: "Debes proporcionar un número de cuenta válido." });
    }

    if (!validarFormatoCuenta(numeroCuenta.trim())) {
      return res.status(400).json({ ok: false, error: "El número de cuenta debe tener exactamente 10 dígitos numéricos." });
    }

    if (monto === undefined || monto === null) {
      return res.status(400).json({ ok: false, error: "El campo 'monto' es obligatorio." });
    }

    const montoNum = Number(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ ok: false, error: "El monto debe ser un número mayor a cero." });
    }

    // Verificar existencia y estado de la cuenta antes de abrir la transacción
    const cuentaExiste = await db.collection("cuentas").findOne({ numeroCuenta: numeroCuenta.trim() });
    if (!cuentaExiste) {
      return res.status(404).json({ ok: false, error: `No existe ninguna cuenta con el número '${numeroCuenta}'.` });
    }
    if (cuentaExiste.estatus !== "activa") {
      return res.status(400).json({ ok: false, error: `La cuenta '${numeroCuenta}' no está activa.` });
    }

    const saldoAnterior = cuentaExiste.saldo;
    let transaccionId;
    let nuevoSaldo;
    let fechaTransaccion;

    // ── Transacción atómica ───────────────────────────────────────────────
    await session.withTransaction(async () => {
      // 1. Verificar saldo y descontar en un solo paso atómico dentro de la transacción
      const cuentaActualizada = await db.collection("cuentas").findOneAndUpdate(
        { numeroCuenta: numeroCuenta.trim(), estatus: "activa", saldo: { $gte: montoNum } },
        { $inc: { saldo: -montoNum } },
        { returnDocument: "after", session }
      );

      if (!cuentaActualizada) {
        throw Object.assign(new Error("Saldo insuficiente para realizar el retiro."), { statusCode: 400, saldoDisponible: saldoAnterior, montoSolicitado: montoNum });
      }

      nuevoSaldo = cuentaActualizada.saldo;
      fechaTransaccion = new Date();

      // 2. Registrar transacción en historial
      const resultado = await db.collection("transacciones").insertOne({
        cuentaId:       cuentaActualizada._id,
        tipo:           "retiro",
        monto:          montoNum,
        fecha:          fechaTransaccion,
        descripcion:    descripcion || "Retiro vía API",
        sucursal:       sucursal || "Sucursal desconocida",
        saldoPosterior: nuevoSaldo
      }, { session });

      transaccionId = resultado.insertedId;

      // 3. Registrar en bitácora
      await db.collection("bitacora").insertOne({
        fecha:     fechaTransaccion,
        usuarioId: new ObjectId(req.usuario.id),
        accion:    "retiro",
        estado:    "exitoso",
        detalle:   { numeroCuenta: numeroCuenta.trim(), monto: montoNum, saldoResultante: nuevoSaldo }
      }, { session });
    });

    // ── Notificación SSE fuera de la transacción ──────────────────────────
    sendAccountUpdate(numeroCuenta.trim(), {
      tipo: "retiro", numeroCuenta: numeroCuenta.trim(),
      monto: montoNum, saldoActual: nuevoSaldo, fecha: fechaTransaccion
    });

    return res.status(201).json({
      ok: true,
      mensaje:       "Retiro realizado correctamente.",
      transaccionId,
      numeroCuenta:  numeroCuenta.trim(),
      montoRetirado: montoNum,
      saldoAnterior,
      saldoActual:   nuevoSaldo
    });

  } catch (error) {
    console.error("Error en POST /api/retiro", error);
    const resp = { ok: false, error: error.message || "Error interno del servidor." };
    if (error.saldoDisponible !== undefined) {
      resp.saldoDisponible = error.saldoDisponible;
      resp.montoSolicitado = error.montoSolicitado;
    }
    return res.status(error.statusCode || 500).json(resp);
  } finally {
    await session.endSession();
  }
});

module.exports = router;
