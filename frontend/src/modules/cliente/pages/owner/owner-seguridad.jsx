import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../lib/supabase.js';
import '../../styles/owner/owner-seguridad.css';

// platform_modules trae los 10 módulos del panel de Administrador (usa las mismas
// etiquetas que OwnerLayout.jsx), pero el panel de Barbero (barbero-layout.jsx) solo
// tiene pantallas reales para 3 de ellos — el resto (Catálogo, Clientes, Estadísticas,
// Fidelidad, Finanzas, Inventario, Pagos) ni siquiera existen ahí. Mostrárselos como
// switches al dueño es confuso: parece que puede bloquear algo que el barbero nunca
// tuvo. Para la vista de Barberos se filtra a solo estos 3, con el nombre real que
// usa su propio menú.
const NOMBRES_MODULO_BARBERO = {
  agenda: 'Gestión de citas',
  cupones: 'Cupones',
  opiniones: 'Opiniones',
};
const CODIGOS_MODULO_BARBERO = Object.keys(NOMBRES_MODULO_BARBERO);

// Mismo criterio para Administradores: solo los 6 módulos con ítem propio en la
// barra lateral de OwnerLayout.jsx (Finanzas, Gestión de Agenda, Inventario (Stock),
// Estadísticas, Fidelidad, Opiniones). Catálogo, Clientes, Cupones y Pagos no tienen
// su propia pantalla ahí, así que no se muestran como bloqueables.
const NOMBRES_MODULO_ADMIN = {};
const CODIGOS_MODULO_ADMIN = ['agenda', 'estadisticas', 'fidelidad', 'finanzas', 'inventario', 'opiniones'];

export default function SeguridadView() {
  const [cargando, setCargando] = useState(true);
  const [barberiaId, setBarberiaId] = useState(null);
  const [vista, setVista] = useState('admin');
  const [administradores, setAdministradores] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [permisos, setPermisos] = useState(new Map());

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: ownerMembership } = await supabase
        .from('barberia_memberships')
        .select('barberia_id')
        .eq('profile_id', uid)
        .eq('role', 'owner')
        .eq('is_active', true)
        .maybeSingle();

      if (!ownerMembership) {
        setCargando(false);
        return;
      }
      setBarberiaId(ownerMembership.barberia_id);

      const [{ data: equipo }, { data: allModulos }] = await Promise.all([
        supabase
          .from('barberia_memberships')
          .select('id, role, display_name, profiles!profile_id(full_name)')
          .eq('barberia_id', ownerMembership.barberia_id)
          .in('role', ['admin', 'barber'])
          .eq('is_active', true)
          .order('joined_at'),
        supabase.from('platform_modules').select('id, code, name, description').order('name'),
      ]);

      setModulos(allModulos ?? []);
      setAdministradores((equipo ?? []).filter((m) => m.role === 'admin'));
      setBarberos((equipo ?? []).filter((m) => m.role === 'barber'));
      setCargando(false);
    }

    cargar();
  }, []);

  const listaActual = vista === 'admin' ? administradores : barberos;

  useEffect(() => {
    // Al cambiar de vista (o cargar por primera vez), selecciona el primer perfil disponible.
    setSeleccionadoId(listaActual[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, administradores, barberos]);

  const membershipSeleccionada = useMemo(
    () => listaActual.find((m) => m.id === seleccionadoId) ?? null,
    [listaActual, seleccionadoId]
  );

  useEffect(() => {
    async function cargarPermisos() {
      if (!membershipSeleccionada) {
        setPermisos(new Map());
        return;
      }
      const { data: existentes } = await supabase
        .from('membership_module_permissions')
        .select('module_id, can_view, can_manage')
        .eq('membership_id', membershipSeleccionada.id);
      setPermisos(new Map((existentes ?? []).map((p) => [p.module_id, p])));
    }

    cargarPermisos();
  }, [membershipSeleccionada]);

  // Sin fila guardada, un módulo está abierto por defecto (así aparecen todos los
  // módulos hasta que el dueño decida bloquear alguno en particular). El switch de
  // un módulo solo bloquea/desbloquea ESE módulo — no afecta a los demás.
  const estaActivo = (moduleId) => {
    const fila = permisos.get(moduleId);
    return fila ? Boolean(fila.can_view) : true;
  };

  const togglePermiso = async (moduleId) => {
    if (!membershipSeleccionada) return;
    const nuevoValor = !estaActivo(moduleId);

    await supabase.from('membership_module_permissions').upsert(
      { membership_id: membershipSeleccionada.id, module_id: moduleId, can_view: nuevoValor, can_manage: nuevoValor },
      { onConflict: 'membership_id,module_id' }
    );

    setPermisos((prev) => {
      const next = new Map(prev);
      next.set(moduleId, { module_id: moduleId, can_view: nuevoValor, can_manage: nuevoValor });
      return next;
    });
  };

  if (cargando) {
    return <div className="seguridad-wrapper"><p>Cargando seguridad...</p></div>;
  }

  if (!barberiaId) {
    return (
      <div className="seguridad-wrapper fade-in">
        <div className="seguridad-header">
          <h2>Seguridad de la Plataforma</h2>
        </div>
      </div>
    );
  }

  const iniciales = (membershipSeleccionada?.display_name ?? membershipSeleccionada?.profiles?.full_name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="seguridad-wrapper fade-in">
      <div className="seguridad-header">
        <h2>Seguridad de la Plataforma</h2>
        <p>Habilita o restringe los accesos que tendrán tus Administradores y Barberos en el Dashboard Espejo.</p>
      </div>

      <div className="role-toggle-group">
        <button
          type="button"
          className={`role-toggle-btn ${vista === 'admin' ? 'is-selected' : ''}`}
          onClick={() => setVista('admin')}
        >
          Administradores
        </button>
        <button
          type="button"
          className={`role-toggle-btn ${vista === 'barbero' ? 'is-selected' : ''}`}
          onClick={() => setVista('barbero')}
        >
          Barberos
        </button>
      </div>

      {listaActual.length === 0 ? (
        <div className="security-panel">
          <p>
            {vista === 'admin'
              ? 'No hay un administrador activo en tu barbería. Crea uno desde Gestión de Usuarios para configurar sus permisos.'
              : 'No hay barberos activos en tu barbería. Crea uno desde Gestión de Usuarios para configurar sus permisos.'}
          </p>
        </div>
      ) : (
        <div className="security-panel">
          <div className="profile-banner">
            <div className="profile-avatar">{iniciales}</div>
            <div className="profile-info">
              {listaActual.length > 1 ? (
                <select
                  className="profile-select"
                  value={seleccionadoId ?? ''}
                  onChange={(e) => setSeleccionadoId(e.target.value)}
                >
                  {listaActual.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name ?? m.profiles?.full_name ?? 'Sin nombre'}
                    </option>
                  ))}
                </select>
              ) : (
                <h3>Perfil: {membershipSeleccionada?.display_name ?? membershipSeleccionada?.profiles?.full_name ?? "Sin nombre"}</h3>
              )}
              <p>Mapeo de accesos de la sucursal</p>
            </div>
          </div>

          <div className="permissions-list">
            {modulos
              .filter((m) => (vista === 'barbero' ? CODIGOS_MODULO_BARBERO : CODIGOS_MODULO_ADMIN).includes(m.code))
              .map((modulo) => {
              const nombresVista = vista === 'barbero' ? NOMBRES_MODULO_BARBERO : NOMBRES_MODULO_ADMIN;
              const activo = estaActivo(modulo.id);
              const nombreModulo = nombresVista[modulo.code] ?? modulo.name;
              return (
                <div key={modulo.id} className={`permission-card ${activo ? 'is-active' : 'is-inactive'}`}>
                  <div className="permission-text">
                    <h4>{nombreModulo}</h4>
                    <p>{modulo.description}</p>
                  </div>

                  <button
                    onClick={() => togglePermiso(modulo.id)}
                    className={`toggle-switch ${activo ? 'toggle-on' : 'toggle-off'}`}
                    aria-pressed={activo}
                  >
                    <div className="toggle-circle"></div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
