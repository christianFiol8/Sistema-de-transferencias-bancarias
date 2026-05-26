const clientsByAccount = new Map();
const statusClients = new Set();

function setupSSE(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

function addClient(numeroCuenta, res) {
  const account = String(numeroCuenta || "").trim();
  if (!account) return;

  setupSSE(res);

  const clients = clientsByAccount.get(account) || new Set();
  clients.add(res);
  clientsByAccount.set(account, clients);

  res.write(`event: connect\ndata: ${JSON.stringify({ ok: true, cuenta: account })}\n\n`);

  res.on("close", () => {
    const current = clientsByAccount.get(account);
    if (!current) return;
    current.delete(res);
    if (current.size === 0) clientsByAccount.delete(account);
  });
}

function addStatusClient(res) {
  setupSSE(res);
  statusClients.add(res);
  res.write(`event: connect\ndata: ${JSON.stringify({ ok: true, status: "connected" })}\n\n`);
  res.on("close", () => { statusClients.delete(res); });
}

function sendAccountUpdate(numeroCuenta, payload = {}) {
  const account = String(numeroCuenta || "").trim();
  const clients = clientsByAccount.get(account);
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify(payload);
  for (const client of Array.from(clients)) {
    try { client.write(`event: update\ndata: ${data}\n\n`); }
    catch (error) { client.end(); }
  }
}

function sendDbAlert(payload = {}) {
  if (statusClients.size === 0) return;
  const data = JSON.stringify(payload);
  for (const client of Array.from(statusClients)) {
    try { client.write(`event: db-alert\ndata: ${data}\n\n`); }
    catch (error) { client.end(); }
  }
}

module.exports = { addClient, addStatusClient, sendAccountUpdate, sendDbAlert };
