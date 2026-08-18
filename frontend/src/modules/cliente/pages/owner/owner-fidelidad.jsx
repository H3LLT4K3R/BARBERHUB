import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Award, Percent } from 'lucide-react';
import { supabase } from '../../../../lib/supabase.js';
import { apiFetch } from '../../../../utils/api.js';
import '../../styles/owner/owner-finanzas.css';

export default function OwnerFidelidad() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [tarjetasActivas, setTarjetasActivas] = useState(0);
  const [puntosDelMes, setPuntosDelMes] = useState(0);
  const [cupones, setCupones] = useState([]);

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from('barberia_memberships')
        .select('barberia_id')
        .eq('profile_id', uid)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        setCargando(false);
        return;
      }

      const [{ count: totalTarjetas }, resumenFidelidad, { data: coupons }] = await Promise.all([
        supabase.from('loyalty_accounts').select('*', { count: 'exact', head: true }).eq('barberia_id', membership.barberia_id),
        // loyalty_ledger no tiene políticas RLS de lectura para nadie (solo el backend la
        // toca) — hay que pedir el resumen por API en vez de leerla directo, si no siempre
        // da 0 aunque sí se hayan otorgado puntos.
        apiFetch('/citas/fidelidad/resumen').catch(() => ({ puntosDelMes: 0 })),
        supabase
          .from('coupons')
          .select('id, code, description, discount_type, discount_value, is_active, coupon_redemptions(id)')
          .eq('barberia_id', membership.barberia_id)
          .order('created_at', { ascending: false }),
      ]);

      setTarjetasActivas(totalTarjetas ?? 0);
      setPuntosDelMes(resumenFidelidad?.puntosDelMes ?? 0);
      setCupones(coupons ?? []);
      setCargando(false);
    }

    cargar();
  }, []);

  if (cargando) {
    return <div className="finanzas-wrapper"><p>Cargando fidelidad...</p></div>;
  }

  return (
    <div className="finanzas-wrapper fade-in">
      <header className="finanzas-header">
        <div className="header-title">
          <Gift className="icon-gold" size={28} />
          <div>
            <h1>Fidelidad y Promociones</h1>
            <p>Control de puntos de lealtad y cupones de descuento.</p>
          </div>
        </div>
      </header>

      <div className="finanzas-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold-transparent">
            <Award size={24} className="text-gold" />
          </div>
          <div className="kpi-info">
            <h3>Cuentas de Fidelidad</h3>
            <p className="kpi-amount text-gold">{tarjetasActivas}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-green-light">
            <Gift size={24} className="text-green" />
          </div>
          <div className="kpi-info">
            <h3>Puntos Otorgados</h3>
            <p className="kpi-amount text-green">{puntosDelMes} <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>este mes</span></p>
          </div>
        </div>
      </div>

      <div className="finanzas-content-grid" style={{ marginTop: '2rem' }}>
        <div className="finanzas-panel border-top-gold" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header">
            <h2>Cupones</h2>
          </div>
          <div className="registro-list">
            {cupones.length === 0 && <div className="empty-state">No hay cupones creados.</div>}
            {cupones.map((cupon) => (
              <div className="registro-item" key={cupon.id}>
                <div className="registro-icono bg-gray-light">
                  <Percent size={20} className="text-gray" />
                </div>
                <div className="registro-detalles">
                  <p className="registro-titulo">{cupon.description ?? cupon.code}</p>
                  <p className="registro-sub">Código: {cupon.code} • Usado: {cupon.coupon_redemptions?.length ?? 0} veces{!cupon.is_active && ' • Inactivo'}</p>
                </div>
                <div className="registro-valor">
                  <p className="valor-negativo">
                    -{cupon.discount_type === 'percent' ? `${cupon.discount_value}%` : `$${cupon.discount_value}`}
                  </p>
                </div>
              </div>
            ))}

            <button className="btn-agregar" style={{ marginTop: '15px', width: '100%', justifyContent: 'center', backgroundColor: '#111827', color: 'white' }} onClick={() => navigate('/crearCupon')}>
              + Crear Nueva Promoción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
