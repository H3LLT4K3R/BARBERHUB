import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconInfoCircle, IconScissors, IconUser, IconUsers } from "@tabler/icons-react";
import { supabase } from "../../../lib/supabase.js";
import { apiFetch } from "../../../utils/api.js";
import { construirCeldasCalendario, fechaAKey, nombreMesAnio, DIAS_CORTOS } from "../../../utils/fecha.js";
import { useActiveAccountGuard } from "../../../hooks/useActiveAccountGuard";
import "../styles/agenda-local.css";

const hoySinHora = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function urlAvatarBarbero(path) {
  if (!path) return null;
  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

export default function AgendaLocal() {
  useActiveAccountGuard();
  const navigate = useNavigate();
  const location = useLocation();
  const volverA = location.state?.volverA ?? "/explorar";

  const { barberiaId, moneda, establecimiento } = location.state ?? {};

  const regresar = () => {
    const volverAtras = location.state?.volverAtras;
    navigate(volverA, volverAtras ? { state: { volverA: volverAtras } } : undefined);
  };

  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(true);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null); // null = sin preferencia

  useEffect(() => {
    if (!barberiaId) return;
    let cancelado = false;

    (async () => {
      const [{ data: serviciosData }, { data: barberosData }] = await Promise.all([
        supabase.from("services").select("id, name, price, duration_minutes").eq("barberia_id", barberiaId).eq("is_active", true).order("sort_order"),
        supabase.from("barberia_memberships").select("id, profile_id, display_name, specialty").eq("barberia_id", barberiaId).eq("role", "barber").eq("is_active", true),
      ]);
      if (cancelado) return;

      // profiles_public en vez de embeber profiles directo: un cliente no puede leer
      // el perfil completo de otra persona por RLS, solo la vista angosta nombre/foto.
      const idsBarberos = [...new Set((barberosData ?? []).map((m) => m.profile_id).filter(Boolean))];
      const { data: avatarsData } = idsBarberos.length
        ? await supabase.from("profiles_public").select("id, avatar_path").in("id", idsBarberos)
        : { data: [] };
      const avatarPorId = new Map((avatarsData ?? []).map((p) => [p.id, p.avatar_path]));
      const barberosConAvatar = (barberosData ?? []).map((m) => ({
        ...m,
        profiles: { avatar_path: avatarPorId.get(m.profile_id) ?? null },
      }));

      setServicios(serviciosData ?? []);
      setBarberos(barberosConAvatar);
      setCargandoOpciones(false);
    })();

    return () => { cancelado = true; };
  }, [barberiaId]);

  const hoy = hoySinHora();
  const [mesVisible, setMesVisible] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [slots, setSlots] = useState([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [error, setError] = useState("");

  const celdas = construirCeldasCalendario(mesVisible.getFullYear(), mesVisible.getMonth());

  const seleccionarDia = (fecha) => {
    setDiaSeleccionado(fecha);
    setHoraSeleccionada(null);
    setCargandoSlots(true);
    setError("");
  };

  // Cambiar de servicio o barbero invalida el día/hora ya elegidos, porque la
  // disponibilidad depende de ambos.
  const seleccionarServicio = (servicio) => {
    setServicioSeleccionado(servicio);
    setDiaSeleccionado(null);
    setHoraSeleccionada(null);
  };

  const seleccionarBarbero = (barbero) => {
    setBarberoSeleccionado(barbero);
    setDiaSeleccionado(null);
    setHoraSeleccionada(null);
  };

  useEffect(() => {
    if (!diaSeleccionado || !barberiaId || !servicioSeleccionado) return;
    let cancelado = false;

    const params = new URLSearchParams({
      barberiaId,
      fecha: fechaAKey(diaSeleccionado),
      duracionMinutos: String(servicioSeleccionado.duration_minutes ?? 30),
    });
    if (barberoSeleccionado) params.set("barberMembershipId", barberoSeleccionado.id);

    apiFetch(`/citas/disponibilidad?${params.toString()}`)
      .then((data) => {
        if (cancelado) return;
        setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (cancelado) return;
        setError("No fue posible cargar los horarios disponibles.");
        setSlots([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoSlots(false);
      });

    return () => {
      cancelado = true;
    };
  }, [diaSeleccionado, barberiaId, servicioSeleccionado, barberoSeleccionado]);

  if (!barberiaId) {
    return (
      <div className="al-pagina">
        <main className="al-contenido">
          <p>Falta seleccionar una barbería. Vuelve a intentarlo desde su perfil.</p>
          <button className="al-boton-regresar" onClick={() => navigate("/explorar")}>Ir a explorar</button>
        </main>
      </div>
    );
  }

  const handleContinuar = () => {
    if (!servicioSeleccionado || !diaSeleccionado || !horaSeleccionada) return;

    navigate("/datos-reserva", {
      state: {
        barberiaId,
        servicioIdReal: servicioSeleccionado.id,
        servicio: servicioSeleccionado.name,
        precio: servicioSeleccionado.price,
        moneda,
        establecimiento,
        barberMembershipId: barberoSeleccionado?.id ?? null,
        barberoNombre: barberoSeleccionado?.display_name ?? null,
        fecha: fechaAKey(diaSeleccionado),
        hora: horaSeleccionada,
      },
    });
  };

  return (
    <div className="al-pagina">
      <header className="al-encabezado">
        <div className="al-info-marca">
          <img src="/logo.png" alt="Logo" className="al-logo" />
          <div className="al-texto-marca">
            <h2>{establecimiento ?? "BARBER HUB"}</h2>
            <span>Barbería</span>
          </div>
        </div>
        <h1 className="al-titulo">Agenda tu próximo corte</h1>
      </header>

      <main className="al-contenido">
        <section className="al-seleccion-reserva">
          <div className="al-grupo-seleccion">
            <h3>Servicio</h3>
            {cargandoOpciones && <p>Cargando servicios...</p>}
            {!cargandoOpciones && servicios.length === 0 && <p>Esta barbería aún no tiene servicios publicados.</p>}
            <div className="al-opciones-servicio">
              {servicios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`al-opcion-servicio ${servicioSeleccionado?.id === s.id ? "activo" : ""}`}
                  onClick={() => seleccionarServicio(s)}
                >
                  <span><IconScissors size={16} stroke={1.7} style={{ verticalAlign: "-3px", marginRight: 6 }} />{s.name}</span>
                  <strong>${s.price}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="al-grupo-seleccion">
            <h3>Barbero</h3>
            <div className="al-opciones-barbero">
              <button
                type="button"
                className={`al-opcion-barbero ${barberoSeleccionado === null ? "activo" : ""}`}
                onClick={() => seleccionarBarbero(null)}
              >
                <IconUsers size={18} />
                <span><strong>Sin preferencia</strong><small>Cualquier barbero disponible</small></span>
              </button>
              {barberos.map((b) => {
                const avatarUrl = urlAvatarBarbero(b.profiles?.avatar_path);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`al-opcion-barbero ${barberoSeleccionado?.id === b.id ? "activo" : ""}`}
                    onClick={() => seleccionarBarbero(b)}
                  >
                    {avatarUrl ? <img src={avatarUrl} alt={b.display_name ?? "Barbero"} /> : <IconUser size={18} />}
                    <span>
                      <strong>{b.display_name ?? "Barbero"}</strong>
                      {b.specialty && <small>{b.specialty}</small>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {!servicioSeleccionado ? (
          <div className="al-aviso-seleccion">
            <IconInfoCircle size={18} />
            <span>Elige un servicio para ver el calendario y los horarios disponibles.</span>
          </div>
        ) : (
          <>
            <section className="al-seccion-calendario">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  disabled={mesVisible.getFullYear() === hoy.getFullYear() && mesVisible.getMonth() === hoy.getMonth()}
                  style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer" }}
                >
                  ‹
                </button>
                <h3 className="al-titulo-mes" style={{ margin: 0, textTransform: "capitalize" }}>
                  {nombreMesAnio(mesVisible)}
                </h3>
                <button
                  type="button"
                  onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer" }}
                >
                  ›
                </button>
              </div>

              <div className="al-grid-calendario">
                {DIAS_CORTOS.map((d) => (
                  <div key={d} className="al-dia-header">{d}</div>
                ))}

                {celdas.map(({ fecha, fueraDeMes }, index) => {
                  const esPasado = fecha < hoy;
                  const deshabilitado = fueraDeMes || esPasado;
                  const esSeleccionado = diaSeleccionado && fechaAKey(fecha) === fechaAKey(diaSeleccionado);

                  return (
                    <div
                      key={index}
                      className={`al-celda-dia ${esSeleccionado ? "activo" : ""} ${deshabilitado ? "vacia" : ""}`}
                      onClick={() => !deshabilitado && seleccionarDia(fecha)}
                    >
                      {fecha.getDate()}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="al-seccion-horarios">
              <h3 className="al-titulo-horarios">HORARIOS DISPONIBLES</h3>

              {!diaSeleccionado && <p>Elige un día en el calendario para ver los horarios.</p>}
              {cargandoSlots && <p>Cargando horarios...</p>}
              {error && <p className="al-error" style={{ color: "#b91c1c" }}>{error}</p>}
              {diaSeleccionado && !cargandoSlots && !error && slots.length === 0 && (
                <p>Este día no tiene horarios disponibles.</p>
              )}

              {diaSeleccionado && !cargandoSlots && slots.length > 0 && (
                <>
                  <div className="al-grid-horarios">
                    {slots.map((slot) => {
                      const esSeleccionado = horaSeleccionada === slot.hora;
                      let claseEstado = "disponible";
                      if (!slot.disponible) claseEstado = "ocupado";
                      else if (esSeleccionado) claseEstado = "seleccionado";

                      return (
                        <button
                          key={slot.hora}
                          className={`al-boton-hora ${claseEstado}`}
                          disabled={!slot.disponible}
                          onClick={() => setHoraSeleccionada(slot.hora)}
                        >
                          {slot.hora}
                        </button>
                      );
                    })}
                  </div>

                  <div className="al-leyenda">
                    <div className="al-leyenda-item"><span className="al-leyenda-punto seleccionado"></span><span>Seleccionado</span></div>
                    <div className="al-leyenda-item"><span className="al-leyenda-punto disponible"></span><span>Disponible</span></div>
                    <div className="al-leyenda-item"><span className="al-leyenda-punto ocupado"></span><span>Ocupado</span></div>
                  </div>
                </>
              )}

              <div className="al-acciones-final">
                <button className="al-boton-regresar" onClick={regresar}>Regresar</button>
                <button className="al-boton-continuar" onClick={handleContinuar} disabled={!diaSeleccionado || !horaSeleccionada}>
                  Continuar
                </button>
              </div>
            </section>
          </>
        )}

        {!servicioSeleccionado && (
          <div className="al-acciones-sin-servicio">
            <button className="al-boton-regresar" onClick={regresar} style={{ flex: "none", padding: "12px 30px", fontSize: "1rem" }}>
              Regresar
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
