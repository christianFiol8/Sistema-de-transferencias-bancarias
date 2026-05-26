const express     = require("express");
const router      = express.Router();
const { getDB }   = require("../db");
const verifyToken = require("../middleware/verifyToken");
const { validarFormatoCuenta } = require("../utils/generarNumeroCuenta");

// GET /api/historial/:cuenta  (protegida con JWT)
router.get("/:cuenta", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const numeroCuenta = req.params.cuenta;

    if (!validarFormatoCuenta(numeroCuenta)) {
      return res.status(400).json({
        ok: false,
        error: "El número de cuenta debe tener exactamente 10 dígitos numéricos."
      });
    }

    const cuenta = await db.collection("cuentas").findOne({ numeroCuenta });
    if (!cuenta) {
      return res.status(404).json({ ok: false, error: "Cuenta no encontrada" });
    }

    const historial = await db.collection("transacciones")
      .find({ cuentaId: cuenta._id })
      .sort({ fecha: -1 })
      .toArray();

    res.json({ ok: true, historial });

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
