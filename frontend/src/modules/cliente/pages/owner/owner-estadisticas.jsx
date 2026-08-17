import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { supabase } from '../../../../lib/supabase.js';
import '../../styles/owner/owner-estadisticas.css';

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function TooltipPersonalizado({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #333' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {label}: <span style={{ color: '#E5C158' }}>${Number(payload[0].value).toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
}

function inicioDeRango(periodo) {
  const inicio = new Date();
  if (periodo === 'dia') inicio.setHours(0, 0, 0, 0);
  else if (periodo === 'semana') inicio.setDate(inicio.getDate() - 6);
  else inicio.setDate(inicio.getDate() - 29);
  if (periodo !== 'dia') inicio.setHours(0, 0, 0, 0);
  return inicio;
}

export default function EstadisticasView() {
  const [barberiaId, setBarberiaId] = useState(null);
  const [periodo, setPeriodo] = useState('semana');
  const [mesDescarga, setMesDescarga] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [diaDescarga, setDiaDescarga] = useState(String(new Date().getDate()).padStart(2, '0'));
  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState({ ingresos: 0, clientes: 0, promedio: 0 });
  const [graficaLinea, setGraficaLinea] = useState([]);
  const [graficaBarras, setGraficaBarras] = useState([]);

  useEffect(() => {
    async function cargarBarberia() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from('barberia_memberships')
        .select('barberia_id')
        .eq('profile_id', uid)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();
      setBarberiaId(membership?.barberia_id ?? null);
    }
    cargarBarberia();
  }, []);

  useEffect(() => {
    if (!barberiaId) return;
    let cancelado = false;

    async function cargarDatos() {
      setCargando(true);
      const inicio = inicioDeRango(periodo);

      const [{ data: ingresos }, { data: appointments }] = await Promise.all([
        supabase
          .from('financial_transactions')
          .select('amount, occurred_at')
          .eq('barberia_id', barberiaId)
          .eq('type', 'income')
          .gte('occurred_at', inicio.toISOString()),
        supabase
          .from('appointments')
          .select('id, scheduled_at, total, appointment_services(service_name, unit_price, quantity)')
          .eq('barberia_id', barberiaId)
          .eq('status', 'completed')
          .gte('scheduled_at', inicio.toISOString()),
      ]);

      if (cancelado) return;

      const buckets = new Map();
      for (const t of ingresos ?? []) {
        const fecha = new Date(t.occurred_at);
        const label = periodo === 'dia'
          ? `${String(fecha.getHours()).padStart(2, '0')}:00`
          : periodo === 'semana'
            ? DIAS_CORTOS[fecha.getDay()]
            : `Sem ${Math.ceil(fecha.getDate() / 7)}`;
        buckets.set(label, (buckets.get(label) ?? 0) + Number(t.amount));
      }
      setGraficaLinea(Array.from(buckets.entries()).map(([label, val]) => ({ label, val })));

      const porServicio = new Map();
      for (const a of appointments ?? []) {
        for (const s of a.appointment_services ?? []) {
          const total = Number(s.unit_price) * s.quantity;
          porServicio.set(s.service_name, (porServicio.get(s.service_name) ?? 0) + total);
        }
      }
      setGraficaBarras(Array.from(porServicio.entries()).map(([categoria, actual]) => ({ categoria, actual })));

      const totalIngresos = (ingresos ?? []).reduce((acc, t) => acc + Number(t.amount), 0);
      const totalClientes = appointments?.length ?? 0;
      setResumen({
        ingresos: totalIngresos,
        clientes: totalClientes,
        promedio: totalClientes ? Math.round(totalIngresos / totalClientes) : 0,
      });

      setCargando(false);
    }

    cargarDatos();
    return () => { cancelado = true; };
  }, [barberiaId, periodo]);

  const filaCSV = (campos) => campos.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(",");

  const descargarExcelCompras = async () => {
    const anio = new Date().getFullYear();
    const fechaFiltro = `${anio}-${mesDescarga}-${diaDescarga}`;
    const inicio = `${fechaFiltro}T00:00:00`;
    const fin = `${fechaFiltro}T23:59:59`;

    const [{ data }, { data: articulos }] = await Promise.all([
      supabase
        .from('inventory_movements')
        .select('created_at, type, quantity, unit_cost, inventory_items!inner(name, barberia_id)')
        .eq('inventory_items.barberia_id', barberiaId)
        .gte('created_at', inicio)
        .lte('created_at', fin),
      supabase
        .from('inventory_items')
        .select('sku, name, description, unit, stock_on_hand, reorder_level, unit_cost, is_active, suppliers(name)')
        .eq('barberia_id', barberiaId)
        .order('name'),
    ]);

    const filasInventario = (data ?? []).map((m) => filaCSV([
      new Date(m.created_at).toLocaleString('es-MX'),
      m.inventory_items?.name ?? '',
      m.type,
      m.quantity,
      m.unit_cost ?? '',
      m.unit_cost ? (Number(m.unit_cost) * Math.abs(m.quantity)).toFixed(2) : '',
    ]));

    const filasCatalogo = (articulos ?? []).map((a) => filaCSV([
      a.sku ?? '',
      a.name,
      a.description ?? '',
      a.unit,
      a.stock_on_hand,
      a.reorder_level,
      a.unit_cost ?? '',
      a.suppliers?.name ?? '',
      a.is_active ? 'Sí' : 'No',
    ]));

    const etiquetaPeriodo = periodo === 'dia' ? 'Día' : periodo === 'semana' ? 'Semana' : 'Mes';

    const secciones = [
      "Movimientos de Inventario del " + new Date(fechaFiltro).toLocaleDateString('es-MX'),
      filaCSV(["Fecha", "Artículo", "Tipo", "Cantidad", "Costo Unitario", "Costo Total"]),
      ...filasInventario,
      "",
      "Catálogo de Inventario",
      filaCSV(["SKU", "Artículo", "Descripción", "Unidad", "Stock Actual", "Nivel de Reorden", "Costo Unitario", "Proveedor", "Activo"]),
      ...filasCatalogo,
      "",
      `Resumen de Ingresos (${etiquetaPeriodo})`,
      filaCSV(["Ingresos Totales", "Clientes Atendidos", "Promedio por Cliente"]),
      filaCSV([resumen.ingresos, resumen.clientes, resumen.promedio]),
      "",
      `Ingresos de la ${periodo === 'dia' ? 'jornada' : periodo}`,
      filaCSV(["Periodo", "Ingresos"]),
      ...graficaLinea.map((p) => filaCSV([p.label, p.val])),
      "",
      "Ingresos por categoría de servicio",
      filaCSV(["Categoría", "Ingresos"]),
      ...graficaBarras.map((b) => filaCSV([b.categoria, b.actual])),
    ];

    const contenidoCSV = secciones.join("\n");

    const blob = new Blob(["﻿" + contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.setAttribute("download", `Reporte_${diaDescarga}_${mesDescarga}.csv`);
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  if (!barberiaId && !cargando) {
    return <div className="estadisticas-wrapper"><p>Solo el dueño o un administrador puede ver estadísticas.</p></div>;
  }

  return (
    <div className="estadisticas-wrapper fade-in">
      <div className="periodo-actions">
        {['dia', 'semana', 'mes'].map((btn) => (
          <button key={btn} onClick={() => setPeriodo(btn)} className={`btn-periodo ${periodo === btn ? 'active' : ''}`} style={{ textTransform: 'capitalize' }}>
            {btn === 'dia' ? 'Día' : btn}
          </button>
        ))}
      </div>

      <div className="dashboard-container">
        {cargando ? <p>Cargando estadísticas...</p> : (
          <>
            <div className="summary-grid">
              <div className="summary-card card-gold">
                <p>Ingresos Totales</p>
                <h3>${resumen.ingresos.toLocaleString()}</h3>
              </div>
              <div className="summary-card card-white">
                <p>Clientes Atendidos</p>
                <h3>{resumen.clientes}</h3>
              </div>
              <div className="summary-card card-black">
                <p>Promedio por Cliente</p>
                <h3>${resumen.promedio}</h3>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-wrapper card-white" style={{ padding: '20px', borderRadius: '12px' }}>
                <h3 className="chart-title">Ingresos de la {periodo === 'dia' ? 'jornada' : periodo}</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graficaLinea} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E5C158" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#E5C158" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip content={<TooltipPersonalizado />} cursor={{ stroke: '#ccc', strokeWidth: 1, strokeDasharray: '5 5' }} />
                      <Area type="monotone" dataKey="val" stroke="#111827" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" activeDot={{ r: 6, fill: "#E5C158", stroke: "#111827", strokeWidth: 2 }} dot={{ r: 4, fill: "#fff", stroke: "#111827", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-wrapper card-white" style={{ padding: '20px', borderRadius: '12px' }}>
                <h3 className="chart-title">Ingresos por categoría de servicio</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graficaBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="categoria" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="actual" name="Ingresos" fill="#E5C158" radius={[4, 4, 0, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="export-section card-white" style={{ padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
          <div className="export-info">
            <h3>Exportar Reporte</h3>
            <p>Descarga los movimientos de inventario del día, el catálogo completo de artículos, y el resumen de ingresos y las gráficas de arriba, en formato Excel (CSV).</p>
          </div>

          <div className="export-controls">
            <select className="export-select" value={mesDescarga} onChange={(e) => setMesDescarga(e.target.value)}>
              {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m, i) => (
                <option key={m} value={m}>{["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][i]}</option>
              ))}
            </select>

            <select className="export-select" value={diaDescarga} onChange={(e) => setDiaDescarga(e.target.value)}>
              {Array.from({ length: 31 }, (_, i) => {
                const dia = (i + 1).toString().padStart(2, '0');
                return <option key={dia} value={dia}>{dia}</option>;
              })}
            </select>

            <button onClick={descargarExcelCompras} className="btn-download">
              <Download size={18} />
              Descargar Tabla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
