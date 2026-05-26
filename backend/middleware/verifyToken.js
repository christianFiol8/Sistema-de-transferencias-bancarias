const jwt = require("jsonwebtoken");

/**
 * Middleware que verifica el token JWT en el encabezado Authorization.
 * Si el token es válido, adjunta los datos del usuario en req.usuario
 * y permite que la solicitud continúe.
 *
 * Uso en rutas:
 *   const verifyToken = require("../middleware/verifyToken");
 *   router.get("/ruta-protegida", verifyToken, (req, res) => { ... });
 *
 * El token debe enviarse en el header:
 *   Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      error: "Acceso no autorizado. Se requiere un token válido."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, correo, numeroCuenta }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        error: "El token ha expirado. Por favor inicia sesión nuevamente."
      });
    }
    return res.status(401).json({
      ok: false,
      error: "Token inválido o malformado."
    });
  }
}

module.exports = verifyToken;
