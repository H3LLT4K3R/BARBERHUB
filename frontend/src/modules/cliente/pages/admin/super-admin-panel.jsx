import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Building2, Eye, EyeOff, CreditCard, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch, clearSession } from "../../../../utils/api.js";
import { ESTADOS, ciudadesDe, zonasDe } from "../../data/ubicaciones.js";
import "../../styles/owner/owner-usuarios.css";

const FORM_INICIAL = {
  nombreBarberia: "", telefono: "", descripcion: "", direccion: "",
  estado: "", ciudad: "", zona: "",
  nombreDuenio: "", emailDuenio: "", passwordDuenio: "",
};

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [barberias, setBarberias] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [barberiaCobro, setBarberiaCobro] = useState(null);
  const [montoCobro, setMontoCobro] = useState("");
  const [enviandoCobro, setEnviandoCobro] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargarBarberias = async () => {
    setCargandoLista(true);
    const { barberias: data } = await apiFetch("/admin/barberias");
    setBarberias(data ?? []);
    setCargandoLista(false);
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", uid).maybeSingle();
      if (cancelado) return;

      if (!profile?.is_super_admin) {
        navigate("/explorar", { replace: true });
        return;
      }
      setAutorizado(true);
      setVerificando(false);
      const { barberias: data } = await apiFetch("/admin/barberias");
      if (!cancelado) {
        setBarberias(data ?? []);
        setCargandoLista(false);
      }
    })();
    return () => { cancelado = true; };
  }, [navigate]);

  const actualizarCampo = (campo, valor) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "estado") { next.ciudad = ""; next.zona = ""; }
      if (campo === "ciudad") { next.zona = ""; }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!form.nombreBarberia.trim() || !form.direccion.trim() || !form.estado || !form.ciudad || !form.zona) {
      setError("Completa nombre, dirección, estado, ciudad y zona de la barbería.");
      return;
    }
    if (!form.nombreDuenio.trim() || !form.emailDuenio.trim() || !form.passwordDuenio) {
      setError("Completa nombre, correo y contraseña del dueño.");
      return;
    }

    setEnviando(true);
    try {
      const resultado = await apiFetch("/admin/barberias", {
        method: "POST",
        body: JSON.stringify({
          nombreBarberia: form.nombreBarberia.trim(),
          telefono: form.telefono.trim(),
          descripcion: form.descripcion.trim(),
          direccion: form.direccion.trim(),
          ciudad: form.ciudad,
          estado: form.estado,
          zona: form.zona,
          nombreDuenio: form.nombreDuenio.trim(),
          emailDuenio: form.emailDuenio.trim(),
          passwordDuenio: form.passwordDuenio,
        }),
      });

      setMensaje(`Barbería "${resultado.barberia.name}" creada. Dueño: ${resultado.duenio.email}.`);
      setForm(FORM_INICIAL);
      await cargarBarberias();
    } catch (err) {
      setError(err.message || "No fue posible crear la barbería.");
    } finally {
      setEnviando(false);
    }
  };

  const handleConfigurarCobro = async (barberiaId) => {
    if (!montoCobro || Number(montoCobro) <= 0) {
      setError("Ingresa un monto mensual válido.");
      return;
    }
    setEnviandoCobro(true);
    setError("");
    try {
      const resultado = await apiFetch("/suscripciones", {
        method: "POST",
        body: JSON.stringify({ barberiaId, monto: Number(montoCobro) }),
      });
      setLinkGenerado(resultado.initPoint);
      setMontoCobro("");
      await cargarBarberias();
    } catch (err) {
      setError(err.message || "No fue posible configurar el cobro.");
    } finally {
      setEnviandoCobro(false);
    }
  };

  const handleSuspension = async (barberiaId, suspender) => {
    setError("");
    try {
      await apiFetch(`/suscripciones/${barberiaId}/suspension`, {
        method: "POST",
        body: JSON.stringify({ suspendida: suspender }),
      });
      await cargarBarberias();
    } catch (err) {
      setError(err.message || "No fue posible actualizar la barbería.");
    }
  };

  const handleEliminar = async (barberia) => {
    const confirmacion = window.prompt(
      `Esto borrará PERMANENTEMENTE "${barberia.name}", todos sus datos y la cuenta de su dueño y equipo. Esta acción no se puede deshacer.\n\nEscribe el nombre exacto de la barbería para confirmar:`
    );
    if (confirmacion !== barberia.name) {
      if (confirmacion !== null) setError("El nombre no coincide. No se eliminó nada.");
      return;
    }

    setEliminandoId(barberia.id);
    setError("");
    setMensaje("");
    try {
      await apiFetch(`/admin/barberias/${barberia.id}`, { method: "DELETE" });
      setMensaje(`Barbería "${barberia.name}" eliminada permanentemente.`);
      await cargarBarberias();
    } catch (err) {
      setError(err.message || "No fue posible eliminar la barbería.");
    } finally {
      setEliminandoId(null);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    navigate("/login");
  };

  if (verificando || !autorizado) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
        <div className="owner-usuarios-container"><p>Verificando acceso...</p></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
    <div className="owner-usuarios-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="owner-usuarios-title"><ShieldCheck size={22} style={{ display: "inline", marginRight: 8 }} />Panel de Super Administrador</h1>
          <p className="owner-usuarios-description">Da de alta barberías reales junto con la cuenta de su dueño.</p>
        </div>
        <button className="owner-usuarios-submit-btn" style={{ maxWidth: 160 }} onClick={handleLogout}>Cerrar sesión</button>
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#15803d" }}>{mensaje}</p>}

      <div className="owner-usuarios-card" style={{ marginBottom: "2rem" }}>
        <div className="owner-usuarios-card-header">
          <Building2 size={24} color="#D4AF37" />
          <h2 className="owner-usuarios-card-title">Registrar Nueva Barbería</h2>
        </div>

        <form className="owner-usuarios-form" onSubmit={handleSubmit}>
          <div>
            <label className="owner-usuarios-label">Nombre de la barbería</label>
            <input type="text" className="owner-usuarios-input" placeholder="Ej. Barber Studio CDMX" value={form.nombreBarberia} onChange={(e) => actualizarCampo("nombreBarberia", e.target.value)} />
          </div>
          <div>
            <label className="owner-usuarios-label">Teléfono</label>
            <input type="tel" className="owner-usuarios-input" placeholder="Teléfono de contacto" value={form.telefono} onChange={(e) => actualizarCampo("telefono", e.target.value)} />
          </div>
          <div>
            <label className="owner-usuarios-label">Descripción</label>
            <input type="text" className="owner-usuarios-input" placeholder="Breve descripción" value={form.descripcion} onChange={(e) => actualizarCampo("descripcion", e.target.value)} />
          </div>
          <div>
            <label className="owner-usuarios-label">Dirección</label>
            <input type="text" className="owner-usuarios-input" placeholder="Calle y número" value={form.direccion} onChange={(e) => actualizarCampo("direccion", e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="owner-usuarios-label">Estado</label>
              <select className="owner-usuarios-input" value={form.estado} onChange={(e) => actualizarCampo("estado", e.target.value)}>
                <option value="">Selecciona</option>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="owner-usuarios-label">Ciudad</label>
              <select className="owner-usuarios-input" value={form.ciudad} onChange={(e) => actualizarCampo("ciudad", e.target.value)} disabled={!form.estado}>
                <option value="">Selecciona</option>
                {ciudadesDe(form.estado).map((ciudad) => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="owner-usuarios-label">Zona</label>
              <select className="owner-usuarios-input" value={form.zona} onChange={(e) => actualizarCampo("zona", e.target.value)} disabled={!form.ciudad}>
                <option value="">Selecciona</option>
                {zonasDe(form.estado, form.ciudad).map((zona) => <option key={zona} value={zona}>{zona}</option>)}
              </select>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />
          <p className="owner-usuarios-label" style={{ marginBottom: 0 }}>Datos del dueño</p>

          <div>
            <label className="owner-usuarios-label">Nombre completo</label>
            <input type="text" className="owner-usuarios-input" placeholder="Ej. Juan Pérez" value={form.nombreDuenio} onChange={(e) => actualizarCampo("nombreDuenio", e.target.value)} />
          </div>
          <div>
            <label className="owner-usuarios-label">Correo electrónico</label>
            <input type="email" className="owner-usuarios-input" placeholder="correo@ejemplo.com" value={form.emailDuenio} onChange={(e) => actualizarCampo("emailDuenio", e.target.value)} />
          </div>
          <div>
            <label className="owner-usuarios-label">Contraseña de acceso</label>
            <div style={{ position: "relative" }}>
              <input
                type={mostrarPassword ? "text" : "password"}
                className="owner-usuarios-input"
                style={{ paddingRight: 40 }}
                placeholder="Mínimo 8 caracteres"
                value={form.passwordDuenio}
                onChange={(e) => actualizarCampo("passwordDuenio", e.target.value)}
              />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="owner-usuarios-submit-btn" disabled={enviando}>
            {enviando ? "Creando..." : "Crear Barbería y Dueño"}
          </button>
        </form>
      </div>

      <div className="card-white-container">
        <h3 className="sub-section-title-large">Barberías registradas</h3>
        <div className="accounts-list-stack">
          {cargandoLista && <p style={{ textAlign: "center", color: "#6b7280", padding: 16 }}>Cargando...</p>}
          {!cargandoLista && barberias.map((b) => (
            <div key={b.id} className="account-row-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div className="account-info-col">
                  <span className="account-name-text">{b.name}</span>
                  <span className="account-email-text">{[b.zone, b.city, b.state].filter(Boolean).join(", ")}</span>
                  {b.duenio && <span className="account-email-text">Dueño: {b.duenio.nombre} · {b.duenio.email}</span>}
                </div>
                <div className="account-badges-group">
                  <span className={`status-badge ${b.is_published && !b.is_suspended ? "is-active" : "is-inactive"}`}>
                    <div className="status-dot"></div> {b.is_suspended ? "Suspendida" : b.is_published ? "Publicada" : "Sin publicar"}
                  </span>
                  <span className={`status-badge ${b.subscription_status === "activa" ? "is-active" : "is-inactive"}`}>
                    <div className="status-dot"></div> Cobro: {b.subscription_status.replace("_", " ")}{b.subscription_amount ? ` ($${b.subscription_amount})` : ""}
                  </span>
                  {!b.duenio && <span className="account-role-badge role-admin">Sin dueño</span>}
                </div>
              </div>

              {b.duenio && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {barberiaCobro === b.id ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        className="owner-usuarios-input"
                        style={{ maxWidth: 140 }}
                        placeholder="Monto mensual"
                        value={montoCobro}
                        onChange={(e) => setMontoCobro(e.target.value)}
                      />
                      <button type="button" className="action-icon-btn edit" onClick={() => handleConfigurarCobro(b.id)} disabled={enviandoCobro}>
                        {enviandoCobro ? "..." : "Generar link"}
                      </button>
                      <button type="button" className="action-icon-btn edit" onClick={() => { setBarberiaCobro(null); setMontoCobro(""); }}>Cancelar</button>
                    </>
                  ) : (
                    <button type="button" className="action-icon-btn edit" onClick={() => { setBarberiaCobro(b.id); setLinkGenerado(null); }} title="Configurar cobro mensual">
                      <CreditCard size={16} />
                    </button>
                  )}

                  {b.is_suspended ? (
                    <button type="button" className="action-icon-btn edit" onClick={() => handleSuspension(b.id, false)} title="Reactivar barbería">
                      <CheckCircle2 size={16} />
                    </button>
                  ) : (
                    <button type="button" className="action-icon-btn edit" onClick={() => handleSuspension(b.id, true)} title="Suspender barbería">
                      <Ban size={16} />
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="action-icon-btn edit"
                  style={{ color: "#b91c1c" }}
                  onClick={() => handleEliminar(b)}
                  disabled={eliminandoId === b.id}
                  title="Eliminar barbería permanentemente (por ejemplo, por falta de pago)"
                >
                  <Trash2 size={16} /> {eliminandoId === b.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>

              {barberiaCobro === b.id && linkGenerado && (
                <p style={{ fontSize: 12, color: "#15803d", wordBreak: "break-all" }}>
                  Link para que el dueño autorice el cobro: <a href={linkGenerado} target="_blank" rel="noreferrer">{linkGenerado}</a>
                </p>
              )}
            </div>
          ))}
          {!cargandoLista && barberias.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, padding: 16 }}>No hay barberías registradas todavía.</p>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
