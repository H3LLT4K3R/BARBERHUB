import { useEffect, useMemo, useState } from "react";
import { Search, Ticket } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import "../../styles/barbero/cupones-barbero.css";

function formatearDescuento(cupon) {
  return cupon.discount_type === "percent" ? `${cupon.discount_value}%` : `$${cupon.discount_value}`;
}

function formatearVigencia(cupon) {
  const fin = new Date(cupon.ends_at);
  return fin.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CuponesBarbero() {
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from("barberia_memberships")
        .select("barberia_id")
        .eq("profile_id", uid)
        .eq("is_active", true)
        .maybeSingle();

      if (!membership) {
        setCargando(false);
        return;
      }

      const { data } = await supabase
        .from("coupons")
        .select("id, code, description, discount_type, discount_value, is_active, ends_at, coupon_redemptions(id)")
        .eq("barberia_id", membership.barberia_id)
        .order("created_at", { ascending: false });

      setCupones(data ?? []);
      setCargando(false);
    }

    cargar();
  }, []);

  const resultados = useMemo(() => cupones.filter((cupon) =>
    `${cupon.description ?? ""} ${cupon.code}`.toLowerCase().includes(busqueda.toLowerCase()),
  ), [busqueda, cupones]);

  if (cargando) {
    return <section className="bc-page"><p>Cargando cupones...</p></section>;
  }

  return (
    <section className="bc-page">
      <header className="bc-heading">
        <div>
          <p className="bc-eyebrow">Panel barbero</p>
          <h2>Cupones de tu barbería</h2>
          <p>Consulta las promociones activas para aplicarlas o mencionarlas a tus clientes. La creación de cupones la gestiona el dueño de la barbería.</p>
        </div>
      </header>

      <div className="bc-layout" style={{ gridTemplateColumns: "1fr" }}>
        <aside className="bc-list-panel">
          <div className="bc-list-head">
            <div><p className="bc-eyebrow">Administración</p><h3>Cupones</h3></div>
          </div>
          <label className="bc-search">
            <Search size={17} />
            <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar cupón..." />
          </label>
          <div className="bc-coupon-table" role="table">
            <div className="bc-table-header" role="row">
              <span>Título / código</span><span>Usos</span><span>Vigencia</span>
            </div>
            {resultados.map((cupon) => (
              <div className="bc-coupon-row" role="row" key={cupon.id} style={{ gridTemplateColumns: "minmax(110px, 1fr) 44px 90px" }}>
                <div><strong>{cupon.description ?? cupon.code}</strong><small>{cupon.code}</small></div>
                <span>{cupon.coupon_redemptions?.length ?? 0}</span>
                <span className={cupon.is_active ? "bc-expiry active" : "bc-expiry"}>
                  {formatearDescuento(cupon)} · {formatearVigencia(cupon)}
                </span>
              </div>
            ))}
            {!resultados.length && <p className="bc-empty"><Ticket size={20} /> No hay cupones que coincidan.</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}
