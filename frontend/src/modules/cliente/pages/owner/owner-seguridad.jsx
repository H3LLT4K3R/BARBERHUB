import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase.js';
import '../../styles/owner/owner-seguridad.css';

export default function SeguridadView() {
  const [cargando, setCargando] = useState(true);
  const [adminMembership, setAdminMembership] = useState(null);
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

      const [{ data: admin }, { data: allModulos }] = await Promise.all([
        supabase
          .from('barberia_memberships')
          .select('id, display_name, profiles!profile_id(full_name)')
          .eq('barberia_id', ownerMembership.barberia_id)
          .eq('role', 'admin')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
        supabase.from('platform_modules').select('id, code, name, description').order('name'),
      ]);

      setModulos(allModulos ?? []);

      if (admin) {
        setAdminMembership(admin);
        const { data: existentes } = await supabase
          .from('membership_module_permissions')
          .select('module_id, can_view, can_manage')
          .eq('membership_id', admin.id);
        setPermisos(new Map((existentes ?? []).map((p) => [p.module_id, p])));
      }

      setCargando(false);
    }

    cargar();
  }, []);

  const togglePermiso = async (moduleId) => {
    if (!adminMembership) return;
    const actual = permisos.get(moduleId);
    const activar = !(actual?.can_view);

    await supabase.from('membership_module_permissions').upsert(
      { membership_id: adminMembership.id, module_id: moduleId, can_view: activar, can_manage: activar },
      { onConflict: 'membership_id,module_id' }
    );

    setPermisos((prev) => {
      const next = new Map(prev);
      next.set(moduleId, { module_id: moduleId, can_view: activar, can_manage: activar });
      return next;
    });
  };

  if (cargando) {
    return <div className="seguridad-wrapper"><p>Cargando seguridad...</p></div>;
  }

  if (!adminMembership) {
    return (
      <div className="seguridad-wrapper fade-in">
        <div className="seguridad-header">
          <h2>Seguridad de la Plataforma</h2>
          <p>No hay un administrador activo en tu barbería. Crea uno desde Gestión de Usuarios para configurar sus permisos.</p>
        </div>
      </div>
    );
  }

  const iniciales = (adminMembership.display_name ?? adminMembership.profiles?.full_name ?? "AD")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="seguridad-wrapper fade-in">
      <div className="seguridad-header">
        <h2>Seguridad de la Plataforma</h2>
        <p>Habilita o restringe los accesos que tendrá tu Administrador en el Dashboard Espejo.</p>
      </div>

      <div className="security-panel">
        <div className="profile-banner">
          <div className="profile-avatar">{iniciales}</div>
          <div className="profile-info">
            <h3>Perfil: {adminMembership.display_name ?? adminMembership.profiles?.full_name ?? "Administrador"}</h3>
            <p>Mapeo de accesos de la sucursal</p>
          </div>
        </div>

        <div className="permissions-list">
          {modulos.map((modulo) => {
            const activo = Boolean(permisos.get(modulo.id)?.can_view);
            return (
              <div key={modulo.id} className={`permission-card ${activo ? 'is-active' : 'is-inactive'}`}>
                <div className="permission-text">
                  <h4>{modulo.name}</h4>
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
    </div>
  );
}
