const express      = require("express");
const router       = express.Router();
const { getDB }    = require("../db");
const verifyToken  = require("../middleware/verifyToken");
const { ObjectId } = require("mongodb");

// ---------------------------------------------------------------------------
// GET /api/bitacora
// Devuelve el historial de auditoría del usuario autenticado
// Soporta paginación: ?page=1&limit=20
// ---------------------------------------------------------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const clienteId = new ObjectId(req.usuario.id);
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const logs = await db
      .collection("bitacora")
      .find({ usuarioId: clienteId })
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("bitacora").countDocuments({ usuarioId: clienteId });

    return res.status(200).json({
      ok: true,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
