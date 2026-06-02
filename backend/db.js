const { MongoClient } = require("mongodb");
const { sendDbAlert } = require("./sse");

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI no está definida");
}

const dbName = process.env.DB_NAME || "nexus_banca";

let client;
let db;

const replicaStatus = {
  primaryCaido: false,
  ultimoEvento: null,
  ultimoError: null
};

async function connectDB() {
  if (db) return db;

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 2000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true
  });

  client.on("serverDescriptionChanged", (event) => {
    const tipo = event.newDescription.type;
    const direccion = event.address;
    replicaStatus.ultimoEvento = { direccion, tipo, timestamp: new Date().toISOString() };
    console.warn(`Cambio en topología: [${direccion}] → ${tipo}`);

    if (tipo === "Unknown" || tipo === "RSGhost") {
      replicaStatus.primaryCaido = true;
      replicaStatus.ultimoError = `Nodo ${direccion} no responde (${tipo})`;
      sendDbAlert({
        type: "error",
        title: "Nodo MongoDB caído",
        message: `El nodo ${direccion} cambió a estado ${tipo}.`
      });
    }
  });

  client.on("topologyDescriptionChanged", (event) => {
    const prevWritable = event.previousDescription?.hasWritableServer;
    const nextWritable = event.newDescription?.hasWritableServer;

    if (prevWritable && !nextWritable) {
      replicaStatus.primaryCaido = true;
      replicaStatus.ultimoError = "Se perdió el nodo primario o no hay servidor escribible.";
      sendDbAlert({
        type: "error",
        title: "Nodo primario inaccesible",
        message: "El Replica Set de MongoDB ya no tiene un primario escribible."
      });
    }

    if (!prevWritable && nextWritable) {
      replicaStatus.primaryCaido = false;
      replicaStatus.ultimoError = null;
      sendDbAlert({
        type: "success",
        title: "Nodo primario restaurado",
        message: "El Replica Set de MongoDB recuperó un nodo primario escribible."
      });
    }
  });

  client.on("serverHeartbeatFailed", (event) => {
    console.error(`Heartbeat fallido en [${event.connectionId}]:`, event.failure?.message);
    replicaStatus.primaryCaido = true;
    replicaStatus.ultimoError = `Heartbeat fallido en ${event.connectionId}`;
    sendDbAlert({
      type: "error",
      title: "Latido de MongoDB fallido",
      message: `Heartbeat fallido en ${event.connectionId}: ${event.failure?.message || "sin detalle"}`
    });
  });

  client.on("serverHeartbeatSucceeded", (event) => {
    const duration = event.duration;
    const THRESHOLD_MS = 300;

    if (duration > THRESHOLD_MS) {
      sendDbAlert({
        type: "warning",
        title: "Latencia alta de MongoDB",
        message: `Latencia de heartbeat detectada: ${duration} ms (> ${THRESHOLD_MS} ms).`
      });
    }

    if (replicaStatus.primaryCaido) {
      replicaStatus.primaryCaido = false;
      replicaStatus.ultimoError = null;
      sendDbAlert({
        type: "success",
        title: "Latido restaurado",
        message: `Heartbeat restaurado en ${event.connectionId}.`
      });
    }
  });

  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ Conectado a MongoDB — base: ${dbName}`);

    // Configurar índices de unicidad requeridos y recomendados
    await db.collection("cuentas").createIndex({ numeroCuenta: 1 }, { unique: true });
    await db.collection("clientes").createIndex({ correo: 1 }, { unique: true });
    await db.collection("clientes").createIndex({ curp: 1 }, { unique: true });
    console.log("   Índices de unicidad configurados.");

    return db;
  } catch (err) {
    console.error("❌ Error al conectar con MongoDB:", err.message);
    throw err;
  }
}

function getDB() {
  if (!db) throw new Error("La base de datos aún no está conectada.");
  return db;
}

function getClient() { return client; }
function getReplicaStatus() { return replicaStatus; }

module.exports = { connectDB, getDB, getClient, getReplicaStatus };
