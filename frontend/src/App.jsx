import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL;

if (!API) {
  throw new Error('VITE_API_URL no está definida');
}

function formatCurrency(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(n);
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
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

const C = {
  bg: '#F6F3EE',
  bgSoft: '#FBF9F6',
  panel: '#FEFDFC',
  panelAlt: '#F7F4EF',
  border: '#E3DED6',
  borderStrong: '#D7D0C6',
  text: '#1F1B16',
  textSoft: '#5F5A53',
  textMute: '#8B847A',
  primary: '#185FA5',
  primaryDark: '#134D86',
  primarySoft: '#EAF2FB',
  success: '#2F6A2D',
  successBg: '#EAF6EA',
  danger: '#A23232',
  dangerBg: '#FCEDEC',
  warning: '#8A5A00',
  warningBg: '#FFF6E6',
  shadow: '0 10px 30px rgba(31, 27, 22, 0.06)',
  shadowSm: '0 4px 12px rgba(31, 27, 22, 0.05)'
};

const S = {
  page: {
    fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
    background: `linear-gradient(180deg, ${C.bgSoft} 0%, ${C.bg} 100%)`,
    minHeight: '100vh',
    color: C.text
  },
  shell: {
    maxWidth: 1160,
    margin: '0 auto',
    width: '100%'
  },
  card: {
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: '1.25rem',
    boxShadow: C.shadow
  },
  cardFlat: {
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '1.1rem'
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    color: C.textSoft
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.5,
    color: C.textMute
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${C.borderStrong}`,
    background: '#fff',
    color: C.text,
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .18s ease, box-shadow .18s ease, transform .18s ease'
  },
  btnPrimary: {
    background: `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 10px 22px rgba(24,95,165,.20)'
  },
  btnSecondary: {
    background: '#fff',
    color: C.text,
    border: `1px solid ${C.borderStrong}`,
    borderRadius: 12,
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  btnGhost: {
    background: 'transparent',
    color: C.textSoft,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  btnDanger: {
    background: C.dangerBg,
    color: C.danger,
    border: '1px solid #EBC7C7',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  alert: (type) => ({
    padding: '12px 14px',
    borderRadius: 14,
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: '1rem',
    border: `1px solid ${
      type === 'error' ? '#E7C1C1' :
      type === 'warning' ? '#E8C77B' :
      '#B9DEBF'
    }`,
    background:
      type === 'error' ? C.dangerBg :
      type === 'warning' ? C.warningBg :
      C.successBg,
    color:
      type === 'error' ? C.danger :
      type === 'warning' ? C.warning :
      C.success
  }),
  tabBtn: (active) => ({
    padding: '10px 14px',
    borderRadius: 12,
    border: active ? '1px solid rgba(24,95,165,.18)' : '1px solid transparent',
    background: active ? C.primarySoft : 'transparent',
    color: active ? C.primary : C.textSoft,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    transition: 'all .18s ease',
    whiteSpace: 'nowrap'
  }),
  statCard: {
    background: 'linear-gradient(180deg, rgba(255,255,255,.86) 0%, rgba(250,248,245,.92) 100%)',
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '1rem',
    boxShadow: C.shadowSm
  }
};

function Alert({ type, text }) {
  if (!text) return null;
  return (
    <div style={S.alert(type)}>
      {type === 'error' ? '⚠ ' : type === 'warning' ? 'ℹ ' : '✅ '}
      {text}
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,.35)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
        marginRight: 8,
        verticalAlign: 'middle'
      }}
    />
  );
}

function SpinnerDark() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid #d1ccc2',
        borderTopColor: C.primary,
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
        marginRight: 8,
        verticalAlign: 'middle'
      }}
    />
  );
}

function LogoMark({ compact = false }) {
  return (
    <div
      style={{
        width: compact ? 34 : 46,
        height: compact ? 34 : 46,
        borderRadius: compact ? 10 : 14,
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F5FAFF',
        boxShadow: '0 10px 22px rgba(24,95,165,.18)',
        flexShrink: 0
      }}
      aria-label="Banco Nexus"
    >
      <svg width={compact ? 18 : 24} height={compact ? 18 : 24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 18V6l7.2 8.4L19 6v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function FieldError({ text }) {
  if (!text) return null;
  return <p style={{ margin: '6px 0 0', fontSize: 12, color: C.danger }}>{text}</p>;
}

function EmptyState({ title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.25rem 1rem' }}>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          margin: '0 auto 14px',
          background: C.primarySoft,
          color: C.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}
      >
        ○
      </div>
      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: C.text }}>{title}</p>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: C.textSoft }}>{text}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap' }}>
      <div>
        {eyebrow ? (
          <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.textMute, fontWeight: 800 }}>
            {eyebrow}
          </p>
        ) : null}
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.text }}>
          {title}
        </h3>
        {text ? (
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.textSoft }}>
            {text}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function SuccessCard({ numeroCuenta, onGoLogin }) {
  return (
    <div style={{ ...S.card, padding: '1.5rem' }}>
      <div style={{ ...S.alert('success'), marginBottom: '1.25rem' }}>
        ✅ Tu cuenta fue creada correctamente y ya está lista para usarse.
      </div>

      <SectionHeader
        eyebrow="Registro completado"
        title="Número de cuenta asignado"
        text="Guárdalo para recibir transferencias y compartirlo con otros usuarios."
      />

      <div
        style={{
          background: 'linear-gradient(180deg, #F3F8FE 0%, #ECF4FD 100%)',
          border: '1px solid #C9DCF1',
          borderRadius: 18,
          padding: '16px 18px',
          marginBottom: '1rem'
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textSoft }}>Cuenta Nexus</p>
        <p style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 26, fontWeight: 800, letterSpacing: 1.1, color: C.primary }}>
          {numeroCuenta}
        </p>
      </div>

      <button style={{ ...S.btnPrimary, width: '100%' }} onClick={onGoLogin}>
        Ir a iniciar sesión
      </button>
    </div>
  );
}

function TxRow({ tx }) {
  const tipos = {
    deposito: { icon: '↓', color: C.success, bg: '#E6F3E4', label: 'Depósito' },
    retiro: { icon: '↑', color: C.danger, bg: '#FDECEC', label: 'Retiro' },
    transferencia_enviada: { icon: '→', color: C.danger, bg: '#FDECEC', label: 'Transferencia enviada' },
    transferencia_recibida: { icon: '←', color: C.success, bg: '#E6F3E4', label: 'Transferencia recibida' }
  };

  const t = tipos[tx.tipo] || { icon: '•', color: C.textMute, bg: '#F1EEE9', label: tx.tipo };
  const isPositive = tx.tipo === 'deposito' || tx.tipo === 'transferencia_recibida';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: t.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.color,
          fontSize: 16,
          fontWeight: 800,
          flexShrink: 0
        }}
      >
        {t.icon}
      </div>

      <div style={{ flex: 1, minWidth: 170 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>
          {tx.descripcion}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textMute }}>
          {t.label} · {formatDateTime(tx.fecha)}
        </p>
      </div>

      <div style={{ textAlign: 'right', minWidth: 135, marginLeft: 'auto' }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 800,
            color: isPositive ? C.success : C.danger,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {isPositive ? '+' : '−'}{formatCurrency(tx.monto)}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textMute, fontVariantNumeric: 'tabular-nums' }}>
          Saldo: {formatCurrency(tx.saldoPosterior)}
        </p>
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
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};

    if (!form.correo?.trim()) errs.correo = 'Ingresa tu correo electrónico.';
    if (!form.contrasena?.trim()) errs.contrasena = 'Ingresa tu contraseña.';

    if (mode === 'registro') {
      if (!form.nombre?.trim()) errs.nombre = 'Ingresa tu nombre.';
      if (!form.apellidoPaterno?.trim()) errs.apellidoPaterno = 'Ingresa tu apellido paterno.';
      if (!form.curp?.trim()) errs.curp = 'Ingresa tu CURP.';
      else if (!/^[A-Za-z0-9]{18}$/.test(form.curp.trim())) errs.curp = 'La CURP debe tener 18 caracteres alfanuméricos.';
      if (!form.telefono?.trim()) errs.telefono = 'Ingresa tu teléfono.';
      else if (!/^\d{10}$/.test(form.telefono.trim())) errs.telefono = 'El teléfono debe tener 10 dígitos.';
      if (form.contrasena && form.contrasena.length < 8) errs.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);

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
        setFieldErrors({});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 4px rgba(24,95,165,.10);
        }
        button { transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease, background .16s ease; }
        button:hover { transform: translateY(-1px); }
        button:disabled { opacity: .72; cursor: not-allowed; transform: none; }
        .auth-grid { display: grid; grid-template-columns: 1.08fr .92fr; gap: 1.25rem; width: 100%; max-width: 1140px; align-items: start; }
        .soft-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
        @media (max-width: 900px) {
          .auth-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .soft-grid, .two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="auth-grid">
        <div
          style={{
            ...S.card,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            background: 'linear-gradient(180deg, rgba(255,255,255,.85) 0%, rgba(249,247,243,.92) 100%)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
              <LogoMark />
              <div>
                <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.04em' }}>
                  Banco Nexus
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textSoft }}>
                  Plataforma bancaria clara, simple y segura.
                </p>
              </div>
            </div>

            <div style={{ maxWidth: 560 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: C.primary }}>
                Banca digital
              </p>
              <h2 style={{ margin: '0 0 12px', fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.05em', fontWeight: 800 }}>
                Consulta tu saldo, administra tus cuentas y transfiere en segundos.
              </h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: C.textSoft }}>
                Accede a tu cuenta, revisa tus movimientos recientes, registra cuentas destino y confirma tus transferencias en un flujo claro de dos pasos.
              </p>
            </div>
          </div>

          <div className="soft-grid">
            <div style={S.statCard}>
              <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Cuenta
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Consulta inmediata</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: C.textSoft }}>
                Visualiza saldo disponible y el resumen de tu cuenta desde el panel.
              </p>
            </div>

            <div style={S.statCard}>
              <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Transferencias
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Flujo guiado</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: C.textSoft }}>
                Captura, revisa y confirma antes de enviar para reducir errores.
              </p>
            </div>

            <div style={S.statCard}>
              <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Destinos
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Accesos rápidos</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: C.textSoft }}>
                Guarda cuentas frecuentes para transferir más rápido.
              </p>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 470, justifySelf: 'center' }}>
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
            <div style={{ ...S.card, padding: '1.35rem' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: 6,
                  background: C.panelAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  marginBottom: '1.1rem'
                }}
              >
                {['login', 'registro'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setError('');
                      setFieldErrors({});
                      setForm({});
                    }}
                    style={{ ...S.tabBtn(mode === m), flex: 1 }}
                  >
                    {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </button>
                ))}
              </div>

              <SectionHeader
                eyebrow={mode === 'login' ? 'Acceso' : 'Alta de usuario'}
                title={mode === 'login' ? 'Bienvenido de nuevo' : 'Abre tu cuenta'}
                text={
                  mode === 'login'
                    ? 'Ingresa tu correo y contraseña para acceder a tu panel.'
                    : 'Completa tu información para crear una cuenta con número asignado automáticamente.'
                }
              />

              <form onSubmit={handleSubmit}>
                {mode === 'registro' && (
                  <>
                    <div className="two-col">
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={S.label}>Nombre *</label>
                        <input style={S.input} placeholder="Juan" value={form.nombre || ''} onChange={set('nombre')} required />
                        <FieldError text={fieldErrors.nombre} />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={S.label}>Apellido paterno *</label>
                        <input style={S.input} placeholder="García" value={form.apellidoPaterno || ''} onChange={set('apellidoPaterno')} required />
                        <FieldError text={fieldErrors.apellidoPaterno} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={S.label}>Apellido materno</label>
                      <input style={S.input} placeholder="López" value={form.apellidoMaterno || ''} onChange={set('apellidoMaterno')} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={S.label}>CURP *</label>
                      <input style={S.input} placeholder="GARL900101HMCRCN01" value={form.curp || ''} onChange={set('curp')} required />
                      <p style={S.helper}>Debe contener 18 caracteres alfanuméricos.</p>
                      <FieldError text={fieldErrors.curp} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={S.label}>Teléfono *</label>
                      <input style={S.input} placeholder="6121234567" value={form.telefono || ''} onChange={set('telefono')} required />
                      <p style={S.helper}>Ingresa 10 dígitos sin espacios ni guiones.</p>
                      <FieldError text={fieldErrors.telefono} />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={S.label}>Correo electrónico *</label>
                  <input style={S.input} type="email" placeholder="usuario@email.com" value={form.correo || ''} onChange={set('correo')} required />
                  <FieldError text={fieldErrors.correo} />
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={S.label}>Contraseña *{mode === 'registro' ? ' (mínimo 8 caracteres)' : ''}</label>
                  <input
                    style={S.input}
                    type="password"
                    placeholder="••••••••"
                    value={form.contrasena || ''}
                    onChange={set('contrasena')}
                    required
                    minLength={mode === 'registro' ? 8 : undefined}
                  />
                  {mode === 'registro' ? (
                    <p style={S.helper}>Usa una contraseña de al menos 8 caracteres.</p>
                  ) : null}
                  <FieldError text={fieldErrors.contrasena} />
                </div>

                <Alert type="error" text={error} />

                <button style={{ ...S.btnPrimary, width: '100%' }} type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner />
                      {mode === 'login' ? 'Entrando...' : 'Creando cuenta...'}
                    </>
                  ) : mode === 'login' ? 'Entrar a mi cuenta' : 'Crear cuenta'}
                </button>
              </form>
            </div>
          )}
        </div>
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
  const [loadingCuenta, setLoadingCuenta] = useState(true);

  const cargarCuenta = useCallback(async () => {
    setLoadingCuenta(true);
    try {
      const data = await apiFetch(`/api/cuenta/${usuario.numeroCuenta}`);
      setCuenta(data.cuenta);
      setHistorial(data.transacciones || []);
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', text: 'No se pudo cargar la información de la cuenta.' });
    } finally {
      setLoadingCuenta(false);
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
    { id: 'inicio', label: 'Inicio' },
    { id: 'transferir', label: 'Transferir' },
    { id: 'historial', label: 'Movimientos' },
    { id: 'destinos', label: 'Cuentas destino' },
    { id: 'perfil', label: 'Mi perfil' }
  ];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 4px rgba(24,95,165,.10);
        }
        button { transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease, background .16s ease, border-color .16s ease; }
        button:hover { transform: translateY(-1px); }
        button:disabled { opacity: .72; cursor: not-allowed; transform: none; }
        .dash-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
        .main-shell { padding: 1.5rem; }
        .two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
        .quick-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .stats-grid { display: grid; grid-template-columns: 1.2fr .8fr .8fr; gap: 12px; }
        .sticky-side { position: sticky; top: 0; height: 100vh; }
        @media (max-width: 1080px) {
          .dash-layout { grid-template-columns: 1fr; }
          .sticky-side { position: relative; height: auto; }
        }
        @media (max-width: 760px) {
          .quick-grid, .stats-grid, .two-col { grid-template-columns: 1fr; }
          .main-shell { padding: 1rem; }
        }
      `}</style>

      <div className="dash-layout">
        <aside
          className="sticky-side"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,.72) 0%, rgba(248,245,240,.9) 100%)',
            borderRight: `1px solid ${C.border}`,
            padding: '1rem'
          }}
        >
          <div style={{ ...S.cardFlat, padding: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,.72)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <LogoMark compact />
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Banco Nexus</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textMute }}>Panel bancario</p>
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, #F4F8FC 0%, #EEF4FA 100%)',
                border: '1px solid #D8E2EC',
                borderRadius: 16,
                padding: '12px 14px'
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: 12, color: C.textMute }}>Usuario</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{usuario.nombre} {usuario.apellidoPaterno}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textSoft, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {usuario.numeroCuenta}
              </p>
            </div>
          </div>

          <div style={{ ...S.cardFlat, padding: '0.75rem', background: 'rgba(255,255,255,.62)' }}>
            <p style={{ margin: '4px 8px 10px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.textMute, fontWeight: 800 }}>
              Navegación
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    textAlign: 'left',
                    padding: '11px 12px',
                    borderRadius: 14,
                    border: tab === t.id ? '1px solid rgba(24,95,165,.18)' : '1px solid transparent',
                    background: tab === t.id ? C.primarySoft : 'transparent',
                    color: tab === t.id ? C.primary : C.textSoft,
                    fontSize: 14,
                    fontWeight: tab === t.id ? 800 : 600
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={onLogout}
                style={{ ...S.btnSecondary, width: '100%' }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <div>
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              borderBottom: `1px solid ${C.border}`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: 'rgba(246,243,238,.72)'
            }}
          >
            <div style={{ ...S.shell, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 12, color: C.textMute, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  Banco Nexus
                </p>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {tab === 'inicio' ? 'Resumen general' :
                   tab === 'transferir' ? 'Nueva transferencia' :
                   tab === 'historial' ? 'Historial de movimientos' :
                   tab === 'destinos' ? 'Cuentas destino' :
                   'Mi perfil'}
                </h2>
              </div>

              <div
                style={{
                  background: '#fff',
                  border: `1px solid ${C.border}`,
                  borderRadius: 999,
                  padding: '7px 12px',
                  fontSize: 13,
                  color: C.textSoft,
                  boxShadow: C.shadowSm
                }}
              >
                Cuenta: <strong style={{ color: C.text }}>{usuario.numeroCuenta}</strong>
              </div>
            </div>
          </header>

          <main className="main-shell" style={{ ...S.shell }}>
            {dbAlert && <Alert type={dbAlert.type} text={`${dbAlert.title}: ${dbAlert.message}`} />}
            {status && <Alert type={status.type} text={status.text} />}

            {loadingCuenta && tab === 'inicio' ? (
              <div style={S.card}>
                <p style={{ margin: 0, fontSize: 14, color: C.text }}>
                  <SpinnerDark />
                  Cargando información de tu cuenta...
                </p>
              </div>
            ) : (
              <>
                {tab === 'inicio' && <TabInicio cuenta={cuenta} historial={historial} usuario={usuario} onNavigate={setTab} />}
                {tab === 'historial' && <TabHistorial historial={historial} />}
                {tab === 'transferir' && (
                  <TabTransferir
                    usuario={usuario}
                    cuenta={cuenta}
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
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function TabInicio({ cuenta, historial, usuario, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="stats-grid">
        <div
          style={{
            ...S.card,
            padding: '1.4rem',
            background: 'linear-gradient(135deg, #185FA5 0%, #1F6AB6 60%, #2C79C5 100%)',
            color: '#fff'
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', opacity: 0.82, fontWeight: 800 }}>
            Saldo disponible
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 34, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
            {cuenta ? formatCurrency(cuenta.saldo) : '—'}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, opacity: 0.92 }}>
            <span>No. cuenta: <strong>{usuario.numeroCuenta}</strong></span>
            <span>{cuenta?.tipoCuenta?.toUpperCase() || 'DÉBITO'}</span>
            <span>Estatus: <strong>{cuenta?.estatus || 'Activo'}</strong></span>
          </div>
        </div>

        <div style={S.cardFlat}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800 }}>
            Movimientos
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em' }}>
            {historial.length}
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: C.textSoft }}>
            Operaciones registradas en tu cuenta.
          </p>
        </div>

        <div style={S.cardFlat}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800 }}>
            Cuentas destino
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em' }}>
            Gestiona
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: C.textSoft }}>
            Guarda accesos rápidos para transferir con mayor facilidad.
          </p>
        </div>
      </div>

      <div className="quick-grid">
        <button style={{ ...S.statCard, textAlign: 'left' }} onClick={() => onNavigate('transferir')}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800 }}>Acción principal</p>
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: C.text }}>Realizar transferencia</p>
          <p style={{ margin: 0, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>Envía dinero a otra cuenta con confirmación previa.</p>
        </button>

        <button style={{ ...S.statCard, textAlign: 'left' }} onClick={() => onNavigate('historial')}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800 }}>Consulta</p>
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: C.text }}>Ver movimientos</p>
          <p style={{ margin: 0, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>Revisa depósitos, retiros y transferencias recientes.</p>
        </button>

        <button style={{ ...S.statCard, textAlign: 'left' }} onClick={() => onNavigate('destinos')}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textMute, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800 }}>Organización</p>
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: C.text }}>Guardar cuentas</p>
          <p style={{ margin: 0, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>Administra cuentas frecuentes para transferir más rápido.</p>
        </button>
      </div>

      <div style={S.card}>
        <SectionHeader
          eyebrow="Actividad reciente"
          title="Últimos movimientos"
          text="Consulta el resumen más reciente de la actividad de tu cuenta."
        />

        {historial.length === 0 ? (
          <EmptyState
            title="Aún no tienes movimientos"
            text="Cuando realices una transferencia o recibas fondos, aquí aparecerá el resumen de tus operaciones."
          />
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
      <SectionHeader
        eyebrow="Registro completo"
        title="Historial de movimientos"
        text={`${historial.length} transacción(es) registradas en tu cuenta.`}
      />

      {historial.length === 0 ? (
        <EmptyState
          title="No hay movimientos registrados"
          text="Aún no se han generado operaciones en esta cuenta. Cuando existan, las verás aquí."
        />
      ) : (
        historial.map((tx, i) => <TxRow key={i} tx={tx} />)
      )}
    </div>
  );
}

function TabTransferir({ cuentasDestino, onSuccess, onError, cuenta }) {
  const [form, setForm] = useState({ cuentaDestino: '', monto: '', mensaje: '' });
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};

    if (!/^\d{10}$/.test(form.cuentaDestino.trim())) {
      errs.cuentaDestino = 'La cuenta destino debe tener exactamente 10 dígitos.';
    }

    if (!form.monto || Number(form.monto) <= 0) {
      errs.monto = 'Ingresa un monto mayor a 0.';
    }

    if (cuenta?.saldo != null && Number(form.monto) > Number(cuenta.saldo)) {
      errs.monto = 'El monto supera el saldo disponible.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');
    if (!validate()) return;
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
      setFieldErrors({});
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
      <SectionHeader
        eyebrow="Transferencias"
        title="Nueva transferencia"
        text="Completa los datos, revisa el resumen y confirma la operación antes de enviarla."
      />

      <div style={{ ...S.alert('warning'), marginBottom: '1rem' }}>
        Paso 1 de 2: captura la cuenta destino, el monto y el concepto de la operación.
      </div>

      <Alert type="error" text={localError} />

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>Cuenta destino (10 dígitos) *</label>
          <input
            style={S.input}
            placeholder="1800000126"
            value={form.cuentaDestino}
            onChange={set('cuentaDestino')}
            pattern="\d{10}"
            required
            maxLength={10}
          />
          <p style={S.helper}>Verifica cuidadosamente el número antes de confirmar.</p>
          <FieldError text={fieldErrors.cuentaDestino} />

          {cuentasDestino.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.textMute, alignSelf: 'center', fontWeight: 700 }}>
                Usar cuenta guardada:
              </span>
              {cuentasDestino.map((cd) => (
                <button
                  key={cd._id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cuentaDestino: cd.numeroCuenta }))}
                  style={{ ...S.btnSecondary, padding: '7px 11px', fontSize: 12 }}
                >
                  {cd.alias}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>Monto (MXN) *</label>
          <input
            style={S.input}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.monto}
            onChange={set('monto')}
            required
          />
          <p style={S.helper}>Saldo disponible: {cuenta ? formatCurrency(cuenta.saldo) : '—'}</p>
          <FieldError text={fieldErrors.monto} />
        </div>

        <div style={{ marginBottom: '1.2rem' }}>
          <label style={S.label}>Mensaje o concepto</label>
          <input
            style={S.input}
            placeholder="Ej. Pago de renta"
            value={form.mensaje}
            onChange={set('mensaje')}
          />
          <p style={S.helper}>Este campo es opcional y te ayuda a identificar la operación.</p>
        </div>

        {confirmOpen ? (
          <div
            style={{
              background: 'linear-gradient(180deg, #F4F8FD 0%, #ECF3FC 100%)',
              border: '1px solid #C9DCF1',
              borderRadius: 18,
              padding: '14px',
              marginBottom: '1rem'
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 12, color: C.primary, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              Paso 2 de 2
            </p>
            <p style={{ margin: '0 0 6px', fontSize: 14 }}>Cuenta destino: <strong>{form.cuentaDestino}</strong></p>
            <p style={{ margin: '0 0 6px', fontSize: 14 }}>Monto: <strong>{formatCurrency(Number(form.monto || 0))}</strong></p>
            <p style={{ margin: 0, fontSize: 14 }}>Concepto: <strong>{form.mensaje || 'Sin mensaje'}</strong></p>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setConfirmOpen(false)} style={{ ...S.btnSecondary, flex: 1, minWidth: 150 }}>
                Corregir datos
              </button>
              <button type="button" onClick={handleConfirm} style={{ ...S.btnPrimary, flex: 1, minWidth: 150 }} disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar transferencia'}
              </button>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btnPrimary, width: '100%' }} type="submit" disabled={loading}>
            Continuar
          </button>
        )}
      </form>
    </div>
  );
}

function TabDestinos({ cuentasDestino, onRefresh, onStatus }) {
  const [form, setForm] = useState({ numeroCuenta: '', alias: '' });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (!/^\d{10}$/.test(form.numeroCuenta.trim())) errs.numeroCuenta = 'El número de cuenta debe tener 10 dígitos.';
    if (!form.alias.trim()) errs.alias = 'Ingresa un alias para identificar la cuenta.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAgregar(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await apiFetch('/api/cuentas-destino', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm({ numeroCuenta: '', alias: '' });
      setFieldErrors({});
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
        <SectionHeader
          eyebrow="Gestión"
          title="Registrar cuenta destino"
          text="Guarda cuentas frecuentes para reducir errores y transferir más rápido."
        />

        <form onSubmit={handleAgregar}>
          <div className="two-col">
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Número de cuenta (10 dígitos)</label>
              <input
                style={S.input}
                placeholder="1800000126"
                value={form.numeroCuenta}
                onChange={set('numeroCuenta')}
                pattern="\d{10}"
                required
                maxLength={10}
              />
              <FieldError text={fieldErrors.numeroCuenta} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Alias</label>
              <input
                style={S.input}
                placeholder="Ej. Mamá"
                value={form.alias}
                onChange={set('alias')}
                required
              />
              <FieldError text={fieldErrors.alias} />
            </div>
          </div>

          <button style={S.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Agregando...' : 'Guardar cuenta destino'}
          </button>
        </form>
      </div>

      <div style={S.card}>
        <SectionHeader
          eyebrow="Directorio"
          title="Cuentas guardadas"
          text="Tus cuentas frecuentes para transferencias futuras."
        />

        {cuentasDestino.length === 0 ? (
          <EmptyState
            title="No tienes cuentas guardadas"
            text="Agrega una cuenta destino para completar transferencias más rápido y con menos riesgo de captura incorrecta."
          />
        ) : (
          cuentasDestino.map((cd) => (
            <div
              key={cd._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: `1px solid ${C.border}`,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{cd.alias}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textSoft, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {cd.numeroCuenta}
                </p>
              </div>

              <button onClick={() => handleEliminar(cd._id)} style={S.btnDanger}>
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
  const [fieldErrors, setFieldErrors] = useState({});
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

  function validate() {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Ingresa tu nombre.';
    if (!form.apellidoPaterno.trim()) errs.apellidoPaterno = 'Ingresa tu apellido paterno.';
    if (!form.telefono.trim()) errs.telefono = 'Ingresa tu teléfono.';
    else if (!/^\d{10}$/.test(form.telefono.trim())) errs.telefono = 'El teléfono debe tener 10 dígitos.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleActualizar(e) {
    e.preventDefault();
    if (!validate()) return;
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
      <div
        style={{
          ...S.card,
          background: 'linear-gradient(180deg, #F4F8FD 0%, #EEF4FA 100%)',
          border: '1px solid #D6E2EE'
        }}
      >
        <SectionHeader
          eyebrow="Cuenta"
          title="Información general"
          text="Datos principales asociados a tu cuenta bancaria."
        />

        <div className="two-col">
          <div>
            <span style={{ fontSize: 12, color: C.textMute, fontWeight: 700 }}>Número de cuenta</span>
            <p style={{ margin: '4px 0 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 800 }}>
              {usuario.numeroCuenta}
            </p>
          </div>

          <div>
            <span style={{ fontSize: 12, color: C.textMute, fontWeight: 700 }}>Correo</span>
            <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{usuario.correo}</p>
          </div>

          <div>
            <span style={{ fontSize: 12, color: C.textMute, fontWeight: 700 }}>Tipo</span>
            <p style={{ margin: '4px 0 0', textTransform: 'capitalize', fontWeight: 600 }}>{cuenta?.tipoCuenta || '—'}</p>
          </div>

          <div>
            <span style={{ fontSize: 12, color: C.textMute, fontWeight: 700 }}>Estatus</span>
            <p style={{ margin: '4px 0 0', color: C.success, fontWeight: 800 }}>{cuenta?.estatus || '—'}</p>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <SectionHeader
          eyebrow="Perfil"
          title="Editar datos personales"
          text="Mantén tu información actualizada para identificar correctamente tu cuenta y tus datos de contacto."
        />

        <form onSubmit={handleActualizar}>
          <div className="two-col">
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Nombre</label>
              <input style={S.input} value={form.nombre} onChange={set('nombre')} />
              <FieldError text={fieldErrors.nombre} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Apellido paterno</label>
              <input style={S.input} value={form.apellidoPaterno} onChange={set('apellidoPaterno')} />
              <FieldError text={fieldErrors.apellidoPaterno} />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={S.label}>Teléfono</label>
            <input style={S.input} placeholder="6121234567" value={form.telefono} onChange={set('telefono')} />
            <p style={S.helper}>Ingresa 10 dígitos para mantener tu información correcta.</p>
            <FieldError text={fieldErrors.telefono} />
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