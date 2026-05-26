const express      = require("express");
const router       = express.Router();
const { getDB }    = require("../db");
const verifyToken  = require("../middleware/verifyToken");
const { validarFormatoCuenta } = require("../utils/generarNumeroCuenta");
const { ObjectId } = require("mongodb");

// ---------------------------------------------------------------------------
// GET /api/cuentas-destino
// Lista las cuentas destino guardadas del usuario autenticado
// ---------------------------------------------------------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const clienteId = new ObjectId(req.usuario.id);

    const cuentas = await db
      .collection("cuentasDestino")
      .find({ clienteId })
      .sort({ alias: 1 })
      .toArray();

    return res.status(200).json({ ok: true, cuentas });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/cuentas-destino
// Registra una cuenta destino con alias
// ---------------------------------------------------------------------------
router.post("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const clienteId = new ObjectId(req.usuario.id);
    const { numeroCuenta, alias } = req.body;

    // Validar formato con regex requerida por el proyecto
    if (!numeroCuenta || !validarFormatoCuenta(numeroCuenta)) {
      return res.status(400).json({
        ok: false,
        error: "El número de cuenta debe tener exactamente 10 dígitos numéricos."
      });
    }

    if (numeroCuenta === req.usuario.numeroCuenta) {
      return res.status(400).json({
        ok: false,
        error: "No puedes agregar tu propia cuenta como destino."
      });
    }

    if (!alias || !alias.trim()) {
      return res.status(400).json({ ok: false, error: "El alias es obligatorio." });
    }

    // Verificar que la cuenta destino existe en el sistema
    const cuentaExiste = await db
      .collection("cuentas")
      .findOne({ numeroCuenta, estatus: "activa" });

    if (!cuentaExiste) {
      return res.status(404).json({
        ok: false,
        error: `No existe ninguna cuenta activa con el número '${numeroCuenta}'.`
      });
    }

    // Verificar que no esté duplicada
    const yaExiste = await db.collection("cuentasDestino").findOne({
      clienteId,
      numeroCuenta
    });

    if (yaExiste) {
      return res.status(409).json({
        ok: false,
        error: "Esa cuenta ya está registrada como destino."
      });
    }

    const nueva = {
      clienteId,
      numeroCuenta,
      alias: alias.trim(),
      fechaRegistro: new Date()
    };

    const resultado = await db.collection("cuentasDestino").insertOne(nueva);

    // Registrar en bitácora
    await db.collection("bitacora").insertOne({
      fecha:     new Date(),
      usuarioId: clienteId,
      accion:    "alta_cuenta_destino",
      estado:    "exitoso",
      detalle:   { numeroCuenta, alias: alias.trim() }
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Cuenta destino registrada correctamente.",
      id: resultado.insertedId,
      numeroCuenta,
      alias: alias.trim()
    });

  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/cuentas-destino/:id
// Elimina una cuenta destino del usuario autenticado
// ---------------------------------------------------------------------------
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const clienteId = new ObjectId(req.usuario.id);
    let entradaId;

    try {
      entradaId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ ok: false, error: "ID inválido." });
    }

    const resultado = await db.collection("cuentasDestino").deleteOne({
      _id: entradaId,
      clienteId
    });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({
        ok: false,
        error: "No se encontró esa cuenta destino o no te pertenece."
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Cuenta destino eliminada."
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
