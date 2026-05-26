const express     = require("express");
const router      = express.Router();
const { getDB }   = require("../db");
const verifyToken = require("../middleware/verifyToken");
const { sendAccountUpdate } = require("../sse");
const { validarFormatoCuenta } = require("../utils/generarNumeroCuenta");

// POST /api/deposito  (protegida con JWT)
router.post("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { numeroCuenta, monto, descripcion, sucursal } = req.body;

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

    const cuenta = await db.collection("cuentas").findOne({ numeroCuenta: numeroCuenta.trim() });
    if (!cuenta) {
      return res.status(404).json({ ok: false, error: `No existe ninguna cuenta con el número '${numeroCuenta}'.` });
    }
    if (cuenta.estatus !== "activa") {
      return res.status(400).json({ ok: false, error: `La cuenta '${numeroCuenta}' no está activa.` });
    }

    const nuevoSaldo = cuenta.saldo + montoNum;
    await db.collection("cuentas").updateOne({ _id: cuenta._id }, { $inc: { saldo: montoNum } });

    const transaccion = {
      cuentaId:       cuenta._id,
      tipo:           "deposito",
      monto:          montoNum,
      fecha:          new Date(),
      descripcion:    descripcion || "Depósito vía API",
      sucursal:       sucursal || "Sucursal desconocida",
      saldoPosterior: nuevoSaldo
    };
    const resultado = await db.collection("transacciones").insertOne(transaccion);

    // Registrar en bitácora
    await db.collection("bitacora").insertOne({
      fecha:     new Date(),
      usuarioId: req.usuario.id,
      accion:    "deposito",
      estado:    "exitoso",
      detalle:   { numeroCuenta: numeroCuenta.trim(), monto: montoNum, saldoResultante: nuevoSaldo }
    });

    sendAccountUpdate(cuenta.numeroCuenta, {
      tipo: "deposito", numeroCuenta: cuenta.numeroCuenta,
      monto: montoNum, saldoActual: nuevoSaldo, fecha: transaccion.fecha
    });

    return res.status(201).json({
      ok: true,
      mensaje:         "Depósito realizado correctamente.",
      transaccionId:   resultado.insertedId,
      numeroCuenta:    cuenta.numeroCuenta,
      montoDepositado: montoNum,
      saldoAnterior:   cuenta.saldo,
      saldoActual:     nuevoSaldo
    });

  } catch (error) {
    console.error("Error en POST /api/deposito", error);
    return res.status(500).json({ ok: false, error: "Error interno del servidor.", detalle: error.message });
  }
});

module.exports = router;
