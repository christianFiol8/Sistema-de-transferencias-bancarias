const express = require("express");
const router  = express.Router();
const { addClient } = require("../sse");

router.get("/:cuenta", (req, res) => {
  const numeroCuenta = String(req.params.cuenta || "").trim();
  if (!numeroCuenta) {
    return res.status(400).json({ ok: false, error: "Debes proporcionar un número de cuenta." });
  }
  addClient(numeroCuenta, res);
});

module.exports = router;
