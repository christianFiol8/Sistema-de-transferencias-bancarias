const express     = require("express");
const router      = express.Router();
const bcrypt      = require("bcryptjs");
const { getDB }   = require("../db");
const verifyToken = require("../middleware/verifyToken");
const { ObjectId } = require("mongodb");

// ---------------------------------------------------------------------------
// GET /api/perfil
// Devuelve los datos del usuario autenticado y su número de cuenta
// ---------------------------------------------------------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const clienteId = new ObjectId(req.usuario.id);

    const cliente = await db.collection("clientes").findOne(
      { _id: clienteId },
      { projection: { contrasena: 0 } } // Nunca devolver la contraseña
    );

    if (!cliente) {
      return res.status(404).json({
        ok: false,
        error: "Usuario no encontrado."
      });
    }

    const cuenta = await db.collection("cuentas").findOne({ clienteId });

    return res.status(200).json({
      ok: true,
      perfil: {
        nombre:          cliente.nombre,
        apellidoPaterno: cliente.apellidoPaterno,
        apellidoMaterno: cliente.apellidoMaterno,
        correo:          cliente.correo,
        telefono:        cliente.telefono,
        curp:            cliente.curp,
        fechaRegistro:   cliente.fechaRegistro
      },
      cuenta: cuenta ? {
        numeroCuenta:  cuenta.numeroCuenta,
        tipoCuenta:    cuenta.tipoCuenta,
        saldo:         cuenta.saldo,
        moneda:        cuenta.moneda,
        fechaApertura: cuenta.fechaApertura,
        estatus:       cuenta.estatus
      } : null
    });

  } catch (error) {
    console.error("Error en GET /api/perfil", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor.",
      detalle: error.message
    });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/perfil
// Actualiza datos editables del usuario autenticado
// Campos permitidos: nombre, apellidoPaterno, apellidoMaterno, telefono
// Opcionalmente puede cambiar la contraseña si envía: contrasenaActual + contrasenaNueva
// Campos NO editables: correo, curp, numeroCuenta
// ---------------------------------------------------------------------------
router.put("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const clienteId = new ObjectId(req.usuario.id);
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      contrasenaActual,
      contrasenaNueva
    } = req.body;

    // Construir objeto de actualización solo con campos permitidos
    const actualizacion = {};

    if (nombre         && nombre.trim())         actualizacion.nombre          = nombre.trim();
    if (apellidoPaterno && apellidoPaterno.trim()) actualizacion.apellidoPaterno = apellidoPaterno.trim();
    if (apellidoMaterno !== undefined)            actualizacion.apellidoMaterno = (apellidoMaterno || "").trim();
    if (telefono        && telefono.trim())       actualizacion.telefono         = telefono.trim();

    // ── Cambio de contraseña opcional ──────────────────────────────────
    if (contrasenaActual || contrasenaNueva) {
      if (!contrasenaActual || !contrasenaNueva) {
        return res.status(400).json({
          ok: false,
          error: "Para cambiar la contraseña debes enviar 'contrasenaActual' y 'contrasenaNueva'."
        });
      }

      if (contrasenaNueva.length < 8) {
        return res.status(400).json({
          ok: false,
          error: "La nueva contraseña debe tener al menos 8 caracteres."
        });
      }

      const cliente = await db.collection("clientes").findOne({ _id: clienteId });
      const esValida = await bcrypt.compare(contrasenaActual, cliente.contrasena);

      if (!esValida) {
        return res.status(401).json({
          ok: false,
          error: "La contraseña actual es incorrecta."
        });
      }

      actualizacion.contrasena = await bcrypt.hash(contrasenaNueva, 12);
    }

    if (Object.keys(actualizacion).length === 0) {
      return res.status(400).json({
        ok: false,
        error: "No se proporcionaron campos válidos para actualizar."
      });
    }

    await db.collection("clientes").updateOne(
      { _id: clienteId },
      { $set: actualizacion }
    );

    // Registrar en bitácora
    await db.collection("bitacora").insertOne({
      fecha:     new Date(),
      usuarioId: clienteId,
      accion:    "actualizacion_perfil",
      estado:    "exitoso",
      detalle:   { camposActualizados: Object.keys(actualizacion).filter(k => k !== "contrasena") }
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil actualizado correctamente."
    });

  } catch (error) {
    console.error("Error en PUT /api/perfil", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor.",
      detalle: error.message
    });
  }
});

module.exports = router;
