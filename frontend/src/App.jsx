import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL;

function formatCurrency(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function formatDateTime(d) {
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getToken() {
  return window._nexusToken || '';
}

function setToken(t) {
  window._nexusToken = t;
}

function setUsuario(u) {
  window._nexusUsuario = u;
}

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

const S = {
  page: {
    fontFamily: "'DM Sans',system-ui,sans-serif",
    background: '#F5F4F0',
    minHeight: '100vh',
    color: '#1C1B19'
  },
  card: {
    background: '#FAFAF8',
    border: '0.5px solid #DDD9D3',
    borderRadius: 12,
    padding: '1.25rem'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #D4D1CA',
    fontFamily: 'inherit',
    fontSize: 14,
    boxSizing: 'border-box',
    background: '#fff',
    outline: 'none'
  },
  btnPrimary: {
    background: '#185FA5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  btnSecondary: {
    background: '#EDEAE5',
    color: '#1C1B19',
    border: '1px solid #D4D1CA',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  btnDanger: {
    background: '#F5ECEB',
    color: '#A32D2D',
    border: '1px solid #ECC',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  label: {
    display: 'block',
    marginBottom: 5,
    fontSize: 12,
    fontWeight: 500,
    color: '#7A7974'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  alert: (type) => ({
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: '1rem',
    background: type === 'error' ? '#FDF2F2' : type === 'warning' ? '#FFF8EC' : '#EAF8EE',
    border: `1px solid ${type === 'error' ? '#F1C0C0' : type === 'warning' ? '#F0C36B' : '#A5E1B7'}`,
    color: type === 'error' ? '#8D2323' : type === 'warning' ? '#7F5A00' : '#1B5F2D'
  }),
  tabBtn: (active) => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    background: active ? '#185FA5' : 'transparent',
    color: active ? '#fff' : '#7A7974'
  })
};

function Alert({ type, text }) {
  if (!text) return null;
  return <div style={S.alert(type)}>{type === 'error' ? '⚠ ' : '✅ '}{text}</div>;
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid #ccc',
        borderTopColor: '#185FA5',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        marginRight: 6
      }}
    />
  );
}

function SuccessCard({ numeroCuenta, onGoLogin }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.alert('success'), marginBottom: '1.25rem' }}>✅ Cuenta creada correctamente.</div>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#7A7974' }}>Tu número de cuenta asignado es:</p>
      <div style={{ background: '#F0F6FF', border: '1px solid #C8DCF5', borderRadius: 10, padding: '14px 16px', marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 24, fontWeight: 700, letterSpacing: 1, color: '#185FA5' }}>{numeroCuenta}</p>
      </div>
      <p style={{ margin: '0 0 1rem', fontSize: 12, color: '#7A7974' }}>
        Guárdalo, lo usarás para recibir transferencias. Ahora ya puedes iniciar sesión.
      </p>
      <button style={{ ...S.btnPrimary, width: '100%' }} onClick={onGoLogin}>
        Ir a iniciar sesión
      </button>
    </div>
  );
}

function TxRow({ tx }) {
  const tipos = {
    deposito: { icon: '↓', color: '#3B6D11', bg: '#EAF3DE', label: 'Depósito' },
    retiro: { icon: '↑', color: '#A32D2D', bg: '#FCEBEB', label: 'Retiro' },
    transferencia_enviada: { icon: '→', color: '#A32D2D', bg: '#FCEBEB', label: 'Enviada' },
    transferencia_recibida: { icon: '←', color: '#3B6D11', bg: '#EAF3DE', label: 'Recibida' }
  };

  const t = tipos[tx.tipo] || { icon: '●', color: '#888', bg: '#F1EFE8', label: tx.tipo };
  const isPositive = tx.tipo === 'deposito' || tx.tipo === 'transferencia_recibida';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #E8E5E0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: t.color, flexShrink: 0 }}>
        {t.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#1C1B19', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.descripcion}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#AAA8A3' }}>{t.label} · {formatDateTime(tx.fecha)}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isPositive ? '#3B6D11' : '#A32D2D' }}>
          {isPositive ? '+' : '−'}{formatCurrency(tx.monto)}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#AAA8A3' }}>Saldo: {formatCurrency(tx.saldoPosterior)}</p>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successAccount, setSuccessAccount] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ correo: form.correo, contrasena: form.contrasena })
        });
        setToken(data.token);
        setUsuario(data.usuario);
        onAuth(data.usuario);
      } else {
        const data = await apiFetch('/api/auth/registro', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        setSuccessAccount(data.numeroCuenta);
        setForm({});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E6F1FB', fontSize: 20, fontFamily: 'Georgia,serif' }}>
            N
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400, fontFamily: "'DM Serif Display',Georgia,serif", color: '#1C1B19' }}>
            Banco Nexus
          </h1>
        </div>

        {successAccount ? (
          <SuccessCard
            numeroCuenta={successAccount}
            onGoLogin={() => {
              setMode('login');
              setSuccessAccount('');
              setError('');
            }}
          />
        ) : (
          <div style={S.card}>
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: '#F1EFE8', borderRadius: 8, padding: 4 }}>
              {['login', 'registro'].map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(''); setForm({}); }} style={{ ...S.tabBtn(mode === m), flex: 1, borderRadius: 6 }}>
                  {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {mode === 'registro' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={S.formGroup}>
                      <label style={S.label}>Nombre *</label>
                      <input style={S.input} placeholder="Juan" value={form.nombre || ''} onChange={set('nombre')} required />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Apellido paterno *</label>
                      <input style={S.input} placeholder="García" value={form.apellidoPaterno || ''} onChange={set('apellidoPaterno')} required />
                    </div>
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Apellido materno</label>
                    <input style={S.input} placeholder="López" value={form.apellidoMaterno || ''} onChange={set('apellidoMaterno')} />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>CURP *</label>
                    <input style={S.input} placeholder="GARL900101HMCRCN01" value={form.curp || ''} onChange={set('curp')} required />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Teléfono *</label>
                    <input style={S.input} placeholder="6121234567" value={form.telefono || ''} onChange={set('telefono')} required />
                  </div>
                </>
              )}

              <div style={S.formGroup}>
                <label style={S.label}>Correo electrónico *</label>
                <input style={S.input} type="email" placeholder="usuario@email.com" value={form.correo || ''} onChange={set('correo')} required />
              </div>

              <div style={{ ...S.formGroup, marginBottom: '1.25rem' }}>
                <label style={S.label}>Contraseña *{mode === 'registro' ? ' (mín. 8 caracteres)' : ''}</label>
                <input style={S.input} type="password" placeholder="••••••••" value={form.contrasena || ''} onChange={set('contrasena')} required minLength={mode === 'registro' ? 8 : undefined} />
              </div>

              <Alert type="error" text={error} />

              <button style={{ ...S.btnPrimary, width: '100%', padding: '12px', fontSize: 14 }} type="submit" disabled={loading}>
                {loading ? <><Spinner />{mode === 'login' ? 'Entrando...' : 'Registrando...'}</> : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ usuario, onLogout }) {
  const [tab, setTab] = useState('inicio');
  const [cuenta, setCuenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cuentasDestino, setCuentasDestino] = useState([]);
  const [dbAlert, setDbAlert] = useState(null);
  const [status, setStatus] = useState(null);

  const cargarCuenta = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/cuenta/${usuario.numeroCuenta}`);
      setCuenta(data.cuenta);
      setHistorial(data.transacciones || []);
    } catch (e) {
      console.error(e);
    }
  }, [usuario.numeroCuenta]);

  const cargarCuentasDestino = useCallback(async () => {
    try {
      const data = await apiFetch('/api/cuentas-destino');
      setCuentasDestino(data.cuentas || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    cargarCuenta();
    cargarCuentasDestino();
  }, [cargarCuenta, cargarCuentasDestino]);

  useEffect(() => {
    const src = new EventSource(`${API}/api/events/status`);
    src.addEventListener('db-alert', (e) => {
      try {
        setDbAlert(JSON.parse(e.data));
      } catch (_) {}
    });
    src.onerror = () => src.close();
    return () => src.close();
  }, []);

  useEffect(() => {
    if (!usuario.numeroCuenta) return;
    const src = new EventSource(`${API}/api/events/${usuario.numeroCuenta}`);
    src.addEventListener('update', () => cargarCuenta());
    src.onerror = () => src.close();
    return () => src.close();
  }, [usuario.numeroCuenta, cargarCuenta]);

  function showStatus(type, text) {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 5000);
  }

  const TABS = [
    { id: 'inicio', label: '🏠 Inicio' },
    { id: 'historial', label: '📋 Historial' },
    { id: 'transferir', label: '↔ Transferir' },
    { id: 'destinos', label: '📒 Mis cuentas' },
    { id: 'perfil', label: '👤 Perfil' }
  ];

  return (
    <div style={{ ...S.page, padding: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      <header style={{ background: '#185FA5', color: '#fff', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: 16, height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: 16 }}>
            N
          </div>
          <span style={{ fontWeight: 500, fontSize: 15 }}>Banco Nexus</span>
        </div>
        <span style={{ fontSize: 13, opacity: 0.85 }}>{usuario.nombre} {usuario.apellidoPaterno}</span>
        <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: '#fff', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
          Salir
        </button>
      </header>

      <nav style={{ background: '#fff', borderBottom: '0.5px solid #DDD9D3', padding: '0 1rem', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#185FA5' : '#7A7974',
              borderBottom: tab === t.id ? '2px solid #185FA5' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {dbAlert && <Alert type={dbAlert.type} text={`${dbAlert.title}: ${dbAlert.message}`} />}
        {status && <Alert type={status.type} text={status.text} />}

        {tab === 'inicio' && <TabInicio cuenta={cuenta} historial={historial} usuario={usuario} />}
        {tab === 'historial' && <TabHistorial historial={historial} />}
        {tab === 'transferir' && (
          <TabTransferir
            usuario={usuario}
            cuentasDestino={cuentasDestino}
            onSuccess={() => {
              cargarCuenta();
              showStatus('success', 'Transferencia realizada correctamente.');
            }}
            onError={(e) => showStatus('error', e)}
          />
        )}
        {tab === 'destinos' && <TabDestinos cuentasDestino={cuentasDestino} onRefresh={cargarCuentasDestino} onStatus={showStatus} />}
        {tab === 'perfil' && <TabPerfil usuario={usuario} cuenta={cuenta} onStatus={showStatus} />}
      </main>
    </div>
  );
}

function TabInicio({ cuenta, historial, usuario }) {
  return (
    <div>
      <h2 style={{ marginTop: 0, fontFamily: "'DM Serif Display',Georgia,serif", fontWeight: 400, fontSize: 22 }}>
        Bienvenido, {usuario.nombre}
      </h2>

      <div style={{ background: '#185FA5', borderRadius: 14, padding: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, opacity: 0.8 }}>Saldo disponible</p>
        <p style={{ margin: '0 0 12px', fontSize: 32, fontFamily: "'DM Serif Display',Georgia,serif", fontWeight: 400 }}>
          {cuenta ? formatCurrency(cuenta.saldo) : '—'}
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, opacity: 0.85 }}>
          <span>No. cuenta: <strong>{usuario.numeroCuenta}</strong></span>
          <span>{cuenta?.tipoCuenta?.toUpperCase() || 'DÉBITO'}</span>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Últimos movimientos</h3>
        {historial.length === 0 ? (
          <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Sin movimientos aún</p>
        ) : (
          historial.slice(0, 5).map((tx, i) => <TxRow key={i} tx={tx} />)
        )}
      </div>
    </div>
  );
}

function TabHistorial({ historial }) {
  return (
    <div style={S.card}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Historial completo</h3>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#AAA' }}>{historial.length} transacciones registradas</p>
      {historial.length === 0 ? (
        <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>No hay movimientos</p>
      ) : (
        historial.map((tx, i) => <TxRow key={i} tx={tx} />)
      )}
    </div>
  );
}

function TabTransferir({ cuentasDestino, onSuccess, onError }) {
  const [form, setForm] = useState({ cuentaDestino: '', monto: '', mensaje: '' });
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      await apiFetch('/api/transferencia', {
        method: 'POST',
        body: JSON.stringify({
          cuentaDestino: form.cuentaDestino,
          monto: Number(form.monto),
          mensaje: form.mensaje
        })
      });
      setForm({ cuentaDestino: '', monto: '', mensaje: '' });
      setConfirmOpen(false);
      onSuccess();
    } catch (err) {
      setLocalError(err.message);
      onError(err.message);
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.card}>
      <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Nueva transferencia</h3>
      <p style={{ margin: '0 0 1.25rem', fontSize: 12, color: '#AAA' }}>Los fondos se transfieren de forma instantánea y segura.</p>
      <Alert type="error" text={localError} />

      <form onSubmit={handleSubmit}>
        <div style={S.formGroup}>
          <label style={S.label}>Cuenta destino (10 dígitos) *</label>
          <input style={S.input} placeholder="1800000126" value={form.cuentaDestino} onChange={set('cuentaDestino')} pattern="\d{10}" required maxLength={10} />
          {cuentasDestino.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#AAA', alignSelf: 'center' }}>Guardadas:</span>
              {cuentasDestino.map((cd) => (
                <button key={cd._id} type="button" onClick={() => setForm((f) => ({ ...f, cuentaDestino: cd.numeroCuenta }))} style={{ ...S.btnSecondary, padding: '3px 10px', fontSize: 11 }}>
                  {cd.alias}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Monto (MXN) *</label>
          <input style={S.input} type="number" min="0.01" step="0.01" placeholder="0.00" value={form.monto} onChange={set('monto')} required />
        </div>

        <div style={{ ...S.formGroup, marginBottom: '1.25rem' }}>
          <label style={S.label}>Mensaje o concepto</label>
          <input style={S.input} placeholder="Ej. Pago de renta" value={form.mensaje} onChange={set('mensaje')} />
        </div>

        {confirmOpen ? (
          <div style={{ background: '#F0F6FF', border: '1px solid #C8DCF5', borderRadius: 10, padding: '12px', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#185FA5', fontWeight: 600 }}>Confirma la transferencia</p>
            <p style={{ margin: '0 0 4px', fontSize: 13 }}>Cuenta destino: <strong>{form.cuentaDestino}</strong></p>
            <p style={{ margin: '0 0 4px', fontSize: 13 }}>Monto: <strong>{formatCurrency(Number(form.monto || 0))}</strong></p>
            <p style={{ margin: 0, fontSize: 13 }}>Concepto: <strong>{form.mensaje || 'Sin mensaje'}</strong></p>
            <div style={{ display: 'flex', gap: 8, marginTop: '12px' }}>
              <button type="button" onClick={() => setConfirmOpen(false)} style={{ ...S.btnSecondary, flex: 1 }}>Cancelar</button>
              <button type="button" onClick={handleConfirm} style={{ ...S.btnPrimary, flex: 1 }} disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btnPrimary, width: '100%', padding: 12 }} type="submit" disabled={loading}>
            {loading ? <><Spinner />Procesando...</> : '↔ Transferir'}
          </button>
        )}
      </form>
    </div>
  );
}

function TabDestinos({ cuentasDestino, onRefresh, onStatus }) {
  const [form, setForm] = useState({ numeroCuenta: '', alias: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleAgregar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/cuentas-destino', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm({ numeroCuenta: '', alias: '' });
      onRefresh();
      onStatus('success', 'Cuenta destino registrada.');
    } catch (err) {
      onStatus('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(id) {
    try {
      await apiFetch(`/api/cuentas-destino/${id}`, { method: 'DELETE' });
      onRefresh();
      onStatus('success', 'Cuenta destino eliminada.');
    } catch (err) {
      onStatus('error', err.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={S.card}>
        <h3 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 600 }}>Registrar cuenta destino</h3>
        <form onSubmit={handleAgregar}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={S.formGroup}>
              <label style={S.label}>Número de cuenta (10 dígitos)</label>
              <input style={S.input} placeholder="1800000126" value={form.numeroCuenta} onChange={set('numeroCuenta')} pattern="\d{10}" required maxLength={10} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Alias</label>
              <input style={S.input} placeholder="Ej. Mamá" value={form.alias} onChange={set('alias')} required />
            </div>
          </div>
          <button style={S.btnPrimary} type="submit" disabled={loading}>{loading ? 'Agregando...' : '+ Agregar'}</button>
        </form>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Cuentas guardadas</h3>
        {cuentasDestino.length === 0 ? (
          <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>No tienes cuentas guardadas aún</p>
        ) : (
          cuentasDestino.map((cd) => (
            <div key={cd._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #E8E5E0' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>{cd.alias}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#AAA', fontFamily: 'monospace' }}>{cd.numeroCuenta}</p>
              </div>
              <button onClick={() => handleEliminar(cd._id)} style={{ ...S.btnDanger, padding: '5px 12px', fontSize: 12 }}>
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TabPerfil({ usuario, cuenta, onStatus }) {
  const [form, setForm] = useState({
    nombre: usuario.nombre || '',
    apellidoPaterno: usuario.apellidoPaterno || '',
    telefono: usuario.telefono || ''
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const data = await apiFetch('/api/perfil');
        const perfil = data.perfil || {};
        setForm({
          nombre: perfil.nombre || usuario.nombre || '',
          apellidoPaterno: perfil.apellidoPaterno || usuario.apellidoPaterno || '',
          telefono: perfil.telefono || usuario.telefono || ''
        });
      } catch (_) {}
    }
    cargarPerfil();
  }, [usuario]);

  async function handleActualizar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/perfil', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      onStatus('success', 'Perfil actualizado correctamente.');
    } catch (err) {
      onStatus('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ ...S.card, background: '#F0F6FF', border: '1px solid #C8DCF5' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#185FA5' }}>Información de cuenta</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: 13 }}>
          <div>
            <span style={{ color: '#888' }}>Número de cuenta</span>
            <p style={{ margin: '2px 0 0', fontFamily: 'monospace', fontWeight: 600 }}>{usuario.numeroCuenta}</p>
          </div>
          <div>
            <span style={{ color: '#888' }}>Correo</span>
            <p style={{ margin: '2px 0 0' }}>{usuario.correo}</p>
          </div>
          <div>
            <span style={{ color: '#888' }}>Tipo</span>
            <p style={{ margin: '2px 0 0', textTransform: 'capitalize' }}>{cuenta?.tipoCuenta || '—'}</p>
          </div>
          <div>
            <span style={{ color: '#888' }}>Estatus</span>
            <p style={{ margin: '2px 0 0', color: '#3B6D11', fontWeight: 500 }}>{cuenta?.estatus || '—'}</p>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 600 }}>Editar datos personales</h3>
        <form onSubmit={handleActualizar}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={S.formGroup}>
              <label style={S.label}>Nombre</label>
              <input style={S.input} value={form.nombre} onChange={set('nombre')} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Apellido paterno</label>
              <input style={S.input} value={form.apellidoPaterno} onChange={set('apellidoPaterno')} />
            </div>
          </div>
          <div style={{ ...S.formGroup, marginBottom: '1.25rem' }}>
            <label style={S.label}>Teléfono</label>
            <input style={S.input} placeholder="6121234567" value={form.telefono} onChange={set('telefono')} />
          </div>
          <button style={S.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [usuario, setUsuarioState] = useState(null);

  function handleAuth(u) {
    setUsuarioState(u);
  }

  function handleLogout() {
    setToken('');
    setUsuario(null);
    setUsuarioState(null);
  }

  if (!usuario) return <AuthScreen onAuth={handleAuth} />;
  return <Dashboard usuario={usuario} onLogout={handleLogout} />;
}