import { BrowserRouter, Routes, Route } from "react-router-dom";

// =========================
// CLIENTE
// =========================

import Landing from "./modules/cliente/pages/landing";
import Login from "./modules/cliente/pages/login";
import Registro from "./modules/cliente/pages/registro";
import VerificarCorreo from "./modules/cliente/pages/verificar-correo";
import AgendaLocal from "./modules/cliente/pages/agenda-local";
import DatosReserva from "./modules/cliente/pages/datos-reserva";
import CitaConfirmada from "./modules/cliente/pages/cita-confirmada";
import Explorar from "./modules/cliente/pages/explorar";
import MasServicios from "./modules/cliente/pages/mas-servicios";
import DetalleCita from "./modules/cliente/pages/detalle-cita";
import RecuperarPassword from "./modules/cliente/pages/recuperar-password";
import RecuperarPasswordEnviado from "./modules/cliente/pages/recuperar-password-enviado";
import RestablecerPassword from "./modules/cliente/pages/restablecer-password";
import RestablecerPasswordExito from "./modules/cliente/pages/restablecer-password-exito";
import OpinionBarberia from "./modules/cliente/pages/opinion-barberia";
import OpinionBarbero from "./modules/cliente/pages/opinion-barbero";
import HistorialCitas from "./modules/cliente/pages/historial-citas";
import Favoritos from "./modules/cliente/pages/favoritos";
import Notificaciones from "./modules/cliente/pages/notificaciones";
import Ajustes from "./modules/cliente/pages/ajustes";
import OpinionBarberiaGeneral from "./modules/cliente/pages/opinion-barberia-general";
import ComentarioEnviado from "./modules/cliente/pages/comentario-enviado";
import PagoAnticipo from "./modules/cliente/pages/pago-anticipo";
import MisCitas from "./modules/cliente/pages/mis-citas";
import BarberiaPerfilComponent from "./modules/cliente/pages/barberia-perfil";
import PerfilBarberoCliente from "./modules/cliente/pages/perfil-barbero-cliente";

import SidebarLayout from "./modules/cliente/components/sidebar-layout";


// =========================
// OWNER
// =========================

import PerfilBarberia from "./modules/cliente/pages/owner/perfilBarberia";
import CrearCupon from "./modules/cliente/pages/Barberias/crearCupon";
import OwnerLayout from "./modules/cliente/pages/owner/OwnerLayout";
import OwnerFinanzas from "./modules/cliente/pages/owner/owner-finanzas";
import OwnerInventario from "./modules/cliente/pages/owner/owner-inventario";
import OwnerAgenda from "./modules/cliente/pages/owner/owner-agenda";
import OwnerEstadisticas from "./modules/cliente/pages/owner/owner-estadisticas";
import OwnerSeguridad from "./modules/cliente/pages/owner/owner-seguridad";
import OwnerControlNegocio from "./modules/cliente/pages/owner/owner-control-negocio";
import OwnerUsuarios from "./modules/cliente/pages/owner/owner-usuarios";
import OwnerFidelidad from "./modules/cliente/pages/owner/owner-fidelidad";
import SuperAdminPanel from "./modules/cliente/pages/admin/super-admin-panel";


// =========================
// BARBERO
// =========================

import BarberoLayout from "./modules/cliente/pages/barbero/barbero-layout";
import DashboardBarbero from "./modules/cliente/pages/barbero/dashboard-barbero";
import CitasBarbero from "./modules/cliente/pages/barbero/citas-barbero";
import CuponesBarbero from "./modules/cliente/pages/barbero/cupones-barbero";
import OpinionesBarbero from "./modules/cliente/pages/barbero/opiniones-barbero";
import PerfilBarberiaBarbero from "./modules/cliente/pages/barbero/perfil-barberia-barbero";
import SeguimientoServicio from "./modules/cliente/pages/barbero/seguimiento-servicio";
import AjustesBarbero from "./modules/cliente/pages/barbero/ajustes-barbero";


function AuthLayout({ children }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

export default function App() {

return (

<BrowserRouter>

<Routes>


{/* =========================
    PUBLICAS
========================= */}

<Route path="/" element={<Landing />} />

<Route path="/login" element={<Login />} />

<Route path="/registro" element={<Registro />} />

<Route 
path="/verificar-correo"
element={<VerificarCorreo />}
/>

<Route 
path="/recuperar-password"
element={<RecuperarPassword />}
/>

<Route 
path="/recuperar-password-enviado"
element={<RecuperarPasswordEnviado />}
/>

<Route 
path="/restablecer-password"
element={<RestablecerPassword />}
/>

<Route 
path="/restablecer-password-exito"
element={<RestablecerPasswordExito />}
/>

<Route
path="/crearCupon"
element={
<OwnerLayout>
<CrearCupon />
</OwnerLayout>
}
/>



{/* =========================
    OWNER
========================= */}

<Route
path="/perfilBarberia"
element={
<OwnerLayout>
<PerfilBarberia />
</OwnerLayout>
}
/>


<Route
path="/owner-finanzas"
element={
<OwnerLayout>
<OwnerFinanzas />
</OwnerLayout>
}
/>


<Route
path="/owner-inventario"
element={
<OwnerLayout>
<OwnerInventario />
</OwnerLayout>
}
/>


<Route
path="/owner-agenda"
element={
<OwnerLayout>
<OwnerAgenda />
</OwnerLayout>
}
/>


<Route
path="/owner-estadisticas"
element={
<OwnerLayout>
<OwnerEstadisticas />
</OwnerLayout>
}
/>


<Route
path="/owner-seguridad"
element={
<OwnerLayout>
<OwnerSeguridad />
</OwnerLayout>
}
/>


<Route
path="/owner-control"
element={
<OwnerLayout>
<OwnerControlNegocio />
</OwnerLayout>
}
/>


<Route
path="/owner-usuarios"
element={
<OwnerLayout>
<OwnerUsuarios />
</OwnerLayout>
}
/>

<Route
path="/owner-fidelidad"
element={
<OwnerLayout>
<OwnerFidelidad />
</OwnerLayout>
}
/>

<Route
path="/owner-opiniones"
element={
<OwnerLayout>
<OpinionesBarbero />
</OwnerLayout>
}
/>


<Route
path="/admin"
element={<SuperAdminPanel />}
/>



{/* =========================
    BARBERO
========================= */}


<Route
path="/barbero/inicio"
element={
<BarberoLayout titulo="Inicio">
<DashboardBarbero />
</BarberoLayout>
}
/>


<Route
path="/barbero/citas"
element={
<BarberoLayout titulo="Citas">
<CitasBarbero />
</BarberoLayout>
}
/>


<Route
path="/barbero/cupones"
element={
<BarberoLayout titulo="Cupones">
<CuponesBarbero />
</BarberoLayout>
}
/>


<Route
path="/barbero/perfil"
element={
<BarberoLayout titulo="Perfil Barbero">
<PerfilBarberiaBarbero />
</BarberoLayout>
}
/>


<Route
path="/barbero/opiniones"
element={
<BarberoLayout titulo="Opiniones">
<OpinionesBarbero />
</BarberoLayout>
}
/>


<Route
path="/barbero/seguimiento"
element={
<BarberoLayout titulo="Seguimiento">
<SeguimientoServicio />
</BarberoLayout>
}
/>

<Route
path="/barbero/ajustes"
element={
<BarberoLayout titulo="Ajustes">
<AjustesBarbero />
</BarberoLayout>
}
/>

{/* =========================
    CLIENTE
========================= */}


<Route
path="/explorar"
element={
<AuthLayout>
<Explorar />
</AuthLayout>
}
/>


<Route
path="/barberia-perfil/:id"
element={<BarberiaPerfilComponent />}
/>

<Route
path="/perfil-barbero/:membershipId"
element={<PerfilBarberoCliente />}
/>


<Route
path="/barberia/:id/servicios"
element={<MasServicios />}
/>


<Route
path="/agenda-local"
element={<AgendaLocal />}
/>


<Route
path="/datos-reserva"
element={<DatosReserva />}
/>


<Route
path="/cita-confirmada"
element={<CitaConfirmada />}
/>


<Route
path="/mis-citas"
element={
<AuthLayout>
<MisCitas />
</AuthLayout>
}
/>


<Route
path="/cita/:id"
element={<DetalleCita />}
/>


<Route
path="/opinion-barberia"
element={<OpinionBarberia />}
/>


<Route
path="/opinion-barbero"
element={<OpinionBarbero />}
/>


<Route
path="/historial-citas"
element={
<AuthLayout>
<HistorialCitas />
</AuthLayout>
}
/>


<Route
path="/favoritos"
element={
<AuthLayout>
<Favoritos />
</AuthLayout>
}
/>


<Route
path="/notificaciones"
element={
<AuthLayout>
<Notificaciones />
</AuthLayout>
}
/>


<Route
path="/ajustes"
element={
<AuthLayout>
<Ajustes />
</AuthLayout>
}
/>


<Route
path="/opinion-barberia-general"
element={<OpinionBarberiaGeneral />}
/>


<Route
path="/comentario-enviado"
element={<ComentarioEnviado />}
/>


<Route
path="/pago-anticipo"
element={<PagoAnticipo />}
/>



{/* =========================
    RUTA DE RESPALDO
========================= */}

<Route
path="*"
element={<Landing />}
/>


</Routes>

</BrowserRouter>

);

}