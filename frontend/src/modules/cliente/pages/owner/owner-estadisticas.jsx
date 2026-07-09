import React, { useState } from 'react';
import { Download } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

/* ASEGÚRATE DE QUE LA RUTA SEA LA CORRECTA */
import '../../styles/owner/owner-estadisticas.css';

export default function EstadisticasView() {
  const [periodo, setPeriodo] = useState('semana');
  const [mesDescarga, setMesDescarga] = useState('06');
  const [diaDescarga, setDiaDescarga] = useState('15');

  // Base de datos con valores reales (no porcentajes)
  const baseDeDatos = {
    dia: {
      ingresos: 3500, clientes: 45, promedio: 77,
      graficaLinea: [
        { label: '10 AM', val: 500, clientes: 8 },
        { label: '1 PM', val: 1200, clientes: 15 },
        { label: '4 PM', val: 800, clientes: 10 },
        { label: '7 PM', val: 1000, clientes: 12 },
      ],
      graficaBarras: [
        { categoria: 'Corte', actual: 1500, anterior: 1200 },
        { categoria: 'Barba', actual: 800, anterior: 900 },
        { categoria: 'Facial', actual: 400, anterior: 600 }
      ]
    },
    semana: {
      ingresos: 19850, clientes: 142, promedio: 140,
      graficaLinea: [
        { label: 'Lun', val: 300, clientes: 5 },
        { label: 'Mar', val: 700, clientes: 12 },
        { label: 'Mié', val: 950, clientes: 15 },
        { label: 'Jue', val: 1200, clientes: 20 },
        { label: 'Vie', val: 3500, clientes: 45 },
        { label: 'Sáb', val: 4200, clientes: 45 },
      ],
      graficaBarras: [
        { categoria: 'Corte', actual: 7500, anterior: 6500 },
        { categoria: 'Barba', actual: 3500, anterior: 4200 },
        { categoria: 'Facial', actual: 1200, anterior: 1500 },
        { categoria: 'Color', actual: 2800, anterior: 2000 }
      ]
    },
    mes: {
      ingresos: 85400, clientes: 610, promedio: 140,
      graficaLinea: [
        { label: 'Sem 1', val: 19000, clientes: 135 },
        { label: 'Sem 2', val: 21000, clientes: 150 },
        { label: 'Sem 3', val: 25000, clientes: 175 },
        { label: 'Sem 4', val: 20400, clientes: 150 },
      ],
      graficaBarras: [
        { categoria: 'Corte', actual: 35000, anterior: 32000 },
        { categoria: 'Barba', actual: 15000, anterior: 14500 },
        { categoria: 'Facial', actual: 8000, anterior: 9000 },
        { categoria: 'Color', actual: 12000, anterior: 10000 }
      ]
    }
  };

  const datosActuales = baseDeDatos[periodo];

  const descargarExcelCompras = () => {
    const encabezados = "Fecha,Articulo Comprado,Categoria,Cantidad,Costo Unitario,Costo Total\n";
    const fechaFiltro = `2026-${mesDescarga}-${diaDescarga}`;
    const datosSimulados = [
      `${fechaFiltro},Cera Mate Pomade,Insumos,5,$100.00,$500.00`,
      `${fechaFiltro},Shampoo Purificante,Insumos,2,$150.00,$300.00`,
      `${fechaFiltro},Navajas (Caja 100),Herramientas,3,$80.00,$240.00`,
      `${fechaFiltro},Bebidas (Cortesía),Gastos,10,$15.00,$150.00`
    ].join("\n");

    const contenidoCSV = "data:text/csv;charset=utf-8," + encabezados + datosSimulados;
    const uriCodificada = encodeURI(contenidoCSV);
    
    const enlace = document.createElement("a");
    enlace.setAttribute("href", uriCodificada);
    enlace.setAttribute("download", `Reporte_Compras_${diaDescarga}_${mesDescarga}.csv`);
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  // Tooltip personalizado usando estilos en línea para evitar problemas de clases
  const TooltipPersonalizado = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#1a1a1a', color: 'white', padding: '12px', 
          borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #333'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            {label}: <span style={{ color: '#E5C158' }}>${payload[0].value.toLocaleString()}</span>
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
            {payload[0].payload.clientes} Clientes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="estadisticas-wrapper fade-in">
      
      {/* Botones Superiores */}
      <div className="periodo-actions">
        {['dia', 'semana', 'mes'].map((btn) => (
          <button 
            key={btn}
            onClick={() => setPeriodo(btn)}
            className={`btn-periodo ${periodo === btn ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {btn}
          </button>
        ))}
      </div>

      {/* Contenedor Principal (Usa el grid de tu CSS) */}
      <div className="dashboard-container">
        
        {/* Tarjetas de Resumen */}
        <div className="summary-grid">
          <div className="summary-card card-gold">
            <p>Ingresos Totales</p>
            <h3>${datosActuales.ingresos.toLocaleString()}</h3>
          </div>
          <div className="summary-card card-white">
            <p>Clientes Atendidos</p>
            <h3>{datosActuales.clientes}</h3>
          </div>
          <div className="summary-card card-black">
            <p>Promedio por Cliente</p>
            <h3>${datosActuales.promedio}</h3>
          </div>
        </div>

        {/* Sección de Gráficas Recharts (Forzadas a tener altura y fondo blanco) */}
        <div className="charts-grid">
          
          {/* Gráfica 1: Área de Líneas */}
          <div className="chart-wrapper card-white" style={{ padding: '20px', borderRadius: '12px' }}>
            <h3 className="chart-title">Ingresos de la {periodo}</h3>
            
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosActuales.graficaLinea} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E5C158" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#E5C158" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip content={<TooltipPersonalizado />} cursor={{ stroke: '#ccc', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#111827" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorIngresos)" 
                    activeDot={{ r: 6, fill: "#E5C158", stroke: "#111827", strokeWidth: 2 }}
                    dot={{ r: 4, fill: "#fff", stroke: "#111827", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfica 2: Barras */}
          <div className="chart-wrapper card-white" style={{ padding: '20px', borderRadius: '12px' }}>
            <h3 className="chart-title">Ingresos por categoría de servicio</h3>
            
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosActuales.graficaBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="categoria" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip 
                    cursor={{fill: '#f9fafb'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                  />
                  <Legend iconType="square" align="right" verticalAlign="top" wrapperStyle={{top: -20, fontSize: '12px', fontWeight: 'bold', color: '#666'}}/>
                  <Bar dataKey="actual" name="Hoy" fill="#E5C158" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="anterior" name="Ayer" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Sección de Exportación (Usa tu CSS original) */}
        <div className="export-section card-white" style={{ padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
          <div className="export-info">
            <h3>Exportar Reporte de Compras</h3>
            <p>Descarga el registro de insumos y gastos en formato Excel (CSV).</p>
          </div>
          
          <div className="export-controls">
            <select className="export-select" value={mesDescarga} onChange={(e) => setMesDescarga(e.target.value)}>
              <option value="01">Enero</option>
              <option value="02">Febrero</option>
              <option value="03">Marzo</option>
              <option value="04">Abril</option>
              <option value="05">Mayo</option>
              <option value="06">Junio</option>
              <option value="07">Julio</option>
              <option value="08">Agosto</option>
              <option value="09">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
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