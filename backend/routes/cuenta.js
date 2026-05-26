const express     = require("express");
const router      = express.Router();
const { getDB }   = require("../db");
const verifyToken = require("../middleware/verifyToken");
const { validarFormatoCuenta } = require("../utils/generarNumeroCuenta");

// GET /api/cuenta/:cuenta  (protegida con JWT)
router.get("/:cuenta", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const numeroCuenta = req.params.cuenta.trim();

    if (!numeroCuenta) {
      return res.status(400).json({ ok: false, error: "Debes proporcionar un número de cuenta." });
    }

    // Validar formato con regex /^\d{10}$/
    if (!validarFormatoCuenta(numeroCuenta)) {
      return res.status(400).json({
        ok: false,
        error: "El número de cuenta debe tener exactamente 10 dígitos numéricos."
      });
    }

    const cuenta = await db.collection("cuentas").findOne({ numeroCuenta });
    if (!cuenta) {
      return res.status(404).json({
        ok: false,
        error: `No existe ninguna cuenta con el número '${numeroCuenta}'.`
      });
    }

    const cliente = await db.collection("clientes").findOne(
      { _id: cuenta.clienteId },
      { projection: { contrasena: 0 } }
    );

    const transacciones = await db.collection("transacciones")
      .find({ cuentaId: cuenta._id })
      .sort({ fecha: -1 })
      .toArray();

    res.json({
      ok: true,
      cuenta: {
        numeroCuenta:  cuenta.numeroCuenta,
        tipoCuenta:    cuenta.tipoCuenta,
        saldo:         cuenta.saldo,
        moneda:        cuenta.moneda,
        fechaApertura: cuenta.fechaApertura,
        estatus:       cuenta.estatus
      },
      cliente: cliente ? {
        nombre:          cliente.nombre,
        apellidoPaterno: cliente.apellidoPaterno,
        apellidoMaterno: cliente.apellidoMaterno,
        correo:          cliente.correo,
        telefono:        cliente.telefono
      } : null,
      transacciones
    });

  } catch (error) {
    console.error("Error en GET /api/cuenta/:cuenta", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor.", detalle: error.message });
  }
});

module.exports = router;
