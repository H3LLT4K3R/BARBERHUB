import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Building2, Eye, EyeOff, Ban, CheckCircle2, Trash2, Star, MapPin, Receipt, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch, clearSession } from "../../../../utils/api.js";
import { ESTADOS, ciudadesDe, zonasDe } from "../../data/ubicaciones.js";
import { evaluarPassword } from "../../../../utils/passwordStrength.js";
import PasswordStrength from "../../components/password-strength.jsx";
import SuperAdminOpiniones from "./super-admin-opiniones.jsx";
import SuperAdminUbicaciones from "./super-admin-ubicaciones.jsx";
import SuperAdminGaleria from "./super-admin-galeria.jsx";
import BarberoModal from "../barbero/barbero-modal.jsx";
import "../../styles/owner/owner-usuarios.css";
import "../../styles/owner/owner-seguridad.css";

const FORM_INICIAL = {
  nombreBarberia: "", telefono: "", descripcion: "", direccion: "",
  estado: "", ciudad: "", zona: "",
  nombreDuenio: "", emailDuenio: "", passwordDuenio: "",
};

const CAMPOS_REQUERIDOS = [
  { campo: "nombreBarberia", etiqueta: "Nombre de la barbería" },
  { campo: "telefono", etiqueta: "Teléfono" },
  { campo: "descripcion", etiqueta: "Descripción" },
  { campo: "direccion", etiqueta: "Dirección" },
  { campo: "estado", etiqueta: "Estado" },
  { campo: "ciudad", etiqueta: "Ciudad" },
  { campo: "zona", etiqueta: "Zona" },
  { campo: "nombreDuenio", etiqueta: "Nombre del dueño" },
  { campo: "emailDuenio", etiqueta: "Correo del dueño" },
  { campo: "passwordDuenio", etiqueta: "Contraseña del dueño" },
];

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
  const [eliminandoId, setEliminandoId] = useState(null);
  const [vista, setVista] = useState("barberias");
  const [opcionesCiudad, setOpcionesCiudad] = useState([]);
  const [opcionesZona, setOpcionesZona] = useState([]);
  const [linkPlataforma, setLinkPlataforma] = useState("");
  const [guardandoLinkPlataforma, setGuardandoLinkPlataforma] = useState(false);
  const [mensajeLinkPlataforma, setMensajeLinkPlataforma] = useState("");
  const [comprobanteRevisar, setComprobanteRevisar] = useState(null);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [motivoRechazoComprobante, setMotivoRechazoComprobante] = useState("");
  const [procesandoComprobante, setProcesandoComprobante] = useState(false);

  useEffect(() => {
    let cancelado = false;
    ciudadesDe(form.estado).then((lista) => { if (!cancelado) setOpcionesCiudad(lista); });
    return () => { cancelado = true; };
  }, [form.estado]);

  useEffect(() => {
    let cancelado = false;
    zonasDe(form.estado, form.ciudad).then((lista) => { if (!cancelado) setOpcionesZona(lista); });
    return () => { cancelado = true; };
  }, [form.estado, form.ciudad]);

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
      // Fetches independientes: si falla la config del link de pago, no debe bloquear
      // la lista de barberías (ya pasó: un 404 temporal en /suscripciones/config dejó el
      // panel entero en "Cargando..." para siempre por culpa de un Promise.all conjunto).
      const { barberias: data } = await apiFetch("/admin/barberias");
      if (!cancelado) {
        setBarberias(data ?? []);
        setCargandoLista(false);
      }
      try {
        const config = await apiFetch("/suscripciones/config");
        if (!cancelado) setLinkPlataforma(config?.subscriptionPaymentLinkUrl ?? "");
      } catch (err) {
        console.error("No fue posible cargar la configuración de la plataforma:", err);
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

    const camposFaltantes = CAMPOS_REQUERIDOS
      .filter(({ campo }) => !form[campo].trim())
      .map(({ etiqueta }) => etiqueta);

    if (camposFaltantes.length > 0) {
      setError(`Completa estos campos: ${camposFaltantes.join(", ")}.`);
      return;
    }
    const { valida } = evaluarPassword(form.passwordDuenio);
    if (!valida) {
      setError("La contraseña debe tener al menos 8 caracteres, una letra, un número y un símbolo.");
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

  const handleGuardarLinkPlataforma = async (e) => {
    e.preventDefault();
    setGuardandoLinkPlataforma(true);
    setMensajeLinkPlataforma("");
    const esBorrado = !linkPlataforma.trim();
    try {
      await apiFetch("/suscripciones/config", {
        method: "PUT",
        body: JSON.stringify({ subscriptionPaymentLinkUrl: linkPlataforma.trim() || null }),
      });
      setMensajeLinkPlataforma(esBorrado ? "Link eliminado correctamente." : "Link guardado correctamente.");
    } catch (err) {
      setMensajeLinkPlataforma(err.message || "No fue posible actualizar el link.");
    } finally {
      setGuardandoLinkPlataforma(false);
    }
  };

  const abrirRevisionComprobante = async (barberia) => {
    setError("");
    setMotivoRechazoComprobante("");
    setComprobanteRevisar(barberia);
    setComprobanteUrl("");
    if (!barberia.subscription_proof_image_path) return;
    const { data, error: urlError } = await supabase.storage
      .from("comprobantes")
      .createSignedUrl(barberia.subscription_proof_image_path, 300);
    if (!urlError) setComprobanteUrl(data.signedUrl);
  };

  const handleConfirmarComprobante = async (barberia) => {
    setProcesandoComprobante(true);
    setError("");
    try {
      await apiFetch(`/suscripciones/${barberia.id}/confirmar`, { method: "POST", body: JSON.stringify({}) });
      setComprobanteRevisar(null);
      await cargarBarberias();
    } catch (err) {
      setError(err.message || "No fue posible confirmar el pago.");
    } finally {
      setProcesandoComprobante(false);
    }
  };

  const handleRechazarComprobante = async (barberia, motivo) => {
    setProcesandoComprobante(true);
    setError("");
    try {
      await apiFetch(`/suscripciones/${barberia.id}/rechazar`, { method: "POST", body: JSON.stringify({ motivo: motivo || "" }) });
      setComprobanteRevisar(null);
      await cargarBarberias();
    } catch (err) {
      setError(err.message || "No fue posible rechazar el comprobante.");
    } finally {
      setProcesandoComprobante(false);
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

      <div className="role-toggle-group" style={{ marginBottom: "1.5rem" }}>
        <button type="button" className={`role-toggle-btn ${vista === "barberias" ? "is-selected" : ""}`} onClick={() => setVista("barberias")}>
          <Building2 size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} /> Barberías
        </button>
        <button type="button" className={`role-toggle-btn ${vista === "opiniones" ? "is-selected" : ""}`} onClick={() => setVista("opiniones")}>
          <Star size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} /> Opiniones
        </button>
        <button type="button" className={`role-toggle-btn ${vista === "ubicaciones" ? "is-selected" : ""}`} onClick={() => setVista("ubicaciones")}>
          <MapPin size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} /> Ubicaciones
        </button>
        <button type="button" className={`role-toggle-btn ${vista === "galeria" ? "is-selected" : ""}`} onClick={() => setVista("galeria")}>
          <ImageIcon size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} /> Galería
        </button>
      </div>

      {vista === "opiniones" && <SuperAdminOpiniones />}
      {vista === "ubicaciones" && <SuperAdminUbicaciones />}
      {vista === "galeria" && <SuperAdminGaleria />}

      {vista === "barberias" && (
      <>
      <div className="owner-usuarios-card" style={{ marginBottom: "2rem" }}>
        <div className="owner-usuarios-card-header">
          <LinkIcon size={24} color="#D4AF37" />
          <h2 className="owner-usuarios-card-title">Cobro de suscripción</h2>
        </div>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: -8, marginBottom: 12 }}>
          Crea un link de pago desde tu cuenta de Mercado Pago y pégalo aquí. Los dueños de las barberías lo usarán para pagar su suscripción mensual; tú confirmas cada pago manualmente cuando suban su comprobante.
        </p>
        <form onSubmit={handleGuardarLinkPlataforma} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="url"
            className="owner-usuarios-input"
            style={{ flex: 1, minWidth: 240 }}
            placeholder="https://www.mercadopago.com.mx/...."
            value={linkPlataforma}
            onChange={(e) => setLinkPlataforma(e.target.value)}
            disabled={guardandoLinkPlataforma}
          />
          <button type="submit" className="owner-usuarios-submit-btn" style={{ marginTop: 0, padding: "12px 24px", maxWidth: 160 }} disabled={guardandoLinkPlataforma}>
            {guardandoLinkPlataforma ? "Guardando..." : "Guardar"}
          </button>
        </form>
        {mensajeLinkPlataforma && (
          <p style={{ color: mensajeLinkPlataforma.startsWith("No fue posible") ? "#b91c1c" : "#15803d", fontSize: 13, marginTop: 8 }}>
            {mensajeLinkPlataforma}
          </p>
        )}
      </div>

      <div className="owner-usuarios-card" style={{ marginBottom: "2rem" }}>
        <div className="owner-usuarios-card-header">
          <Building2 size={24} color="#D4AF37" />
          <h2 className="owner-usuarios-card-title">Registrar Nueva Barbería</h2>
        </div>

        <form className="owner-usuarios-form" onSubmit={handleSubmit} autoComplete="off">
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
                {opcionesCiudad.map((ciudad) => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="owner-usuarios-label">Zona</label>
              <select className="owner-usuarios-input" value={form.zona} onChange={(e) => actualizarCampo("zona", e.target.value)} disabled={!form.ciudad}>
                <option value="">Selecciona</option>
                {opcionesZona.map((zona) => <option key={zona} value={zona}>{zona}</option>)}
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
            <input type="email" className="owner-usuarios-input" placeholder="correo@ejemplo.com" value={form.emailDuenio} onChange={(e) => actualizarCampo("emailDuenio", e.target.value)} autoComplete="off" />
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
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <PasswordStrength password={form.passwordDuenio} />
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
                  {b.subscription_status === "pendiente_revision" && (
                    <button type="button" className="action-icon-btn edit" onClick={() => abrirRevisionComprobante(b)} title="Revisar comprobante de suscripción">
                      <Receipt size={16} /> Revisar comprobante
                    </button>
                  )}

                  {b.is_suspended ? (
                    <button type="button" className="action-icon-btn edit" onClick={() => handleSuspension(b.id, false)} title="Reactivar barbería y restaurar el acceso del dueño y su equipo">
                      <CheckCircle2 size={16} />
                    </button>
                  ) : (
                    <button type="button" className="action-icon-btn edit" onClick={() => handleSuspension(b.id, true)} title="Suspender barbería: bloquea temporalmente el acceso del dueño y su equipo (p. ej. por falta de pago)">
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
            </div>
          ))}
          {!cargandoLista && barberias.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, padding: 16 }}>No hay barberías registradas todavía.</p>
          )}
        </div>
      </div>

      <BarberoModal
        open={Boolean(comprobanteRevisar)}
        title="Revisar comprobante de suscripción"
        onClose={() => setComprobanteRevisar(null)}
        footer={
          <>
            <button className="bm-secondary" onClick={() => handleRechazarComprobante(comprobanteRevisar, motivoRechazoComprobante)} disabled={procesandoComprobante}>
              Rechazar
            </button>
            <button className="bm-primary" onClick={() => handleConfirmarComprobante(comprobanteRevisar)} disabled={procesandoComprobante}>
              Confirmar pago recibido
            </button>
          </>
        }
      >
        <p style={{ margin: "0 0 10px" }}>
          <strong>{comprobanteRevisar?.name}</strong>
          {comprobanteRevisar?.duenio && <> — Dueño: {comprobanteRevisar.duenio.nombre}</>}
        </p>
        {comprobanteUrl ? (
          <img src={comprobanteUrl} alt="Comprobante de pago" style={{ width: "100%", borderRadius: 8, border: "1px solid #e5e7eb" }} />
        ) : (
          <p style={{ color: "#6b7280" }}>Cargando comprobante...</p>
        )}
        <textarea
          style={{ marginTop: 10, width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}
          value={motivoRechazoComprobante}
          onChange={(e) => setMotivoRechazoComprobante(e.target.value)}
          placeholder="Si vas a rechazarlo, explica por qué (opcional)…"
        />
      </BarberoModal>
      </>
      )}
    </div>
    </div>
  );
}
