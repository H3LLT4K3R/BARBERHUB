import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- IMPORTS DE CLIENTE ---
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
// Import correcto para la vista de la barbería desde el lado del cliente
import BarberiaPerfilComponent from "./modules/cliente/pages/barberia-perfil"; 

// Componente Layout del Cliente
import SidebarLayout from "./modules/cliente/components/sidebar-layout";

// --- VISTAS DE LAS BARBERÍAS ---
// Import correcto para el perfil desde el lado del dueño
import PerfilBarberia from "./modules/cliente/pages/owner/perfilBarberia";
import CrearCupon from "./modules/cliente/pages/Barberias/crearCupon";

// --- IMPORTS DE OWNER ---
import OwnerLayout from "./modules/cliente/pages/owner/OwnerLayout";
import OwnerFinanzas from "./modules/cliente/pages/owner/owner-finanzas";
import OwnerInventario from "./modules/cliente/pages/owner/owner-inventario";
import OwnerAgenda from "./modules/cliente/pages/owner/owner-agenda";
import OwnerEstadisticas from "./modules/cliente/pages/owner/owner-estadisticas";
import OwnerSeguridad from "./modules/cliente/pages/owner/owner-seguridad";
import OwnerControlNegocio from "./modules/cliente/pages/owner/owner-control-negocio";
import OwnerUsuarios from "./modules/cliente/pages/owner/owner-usuarios"; 

// IMPORTS DEL BARBERO //
import SeguimientoServicio from "./modules/cliente/pages/barbero/seguimiento-servicio";
import BarberoLayout from "./modules/cliente/pages/barbero/barbero-layout";
<<<<<<< Updated upstream
=======
import DashboardBarbero from "./modules/cliente/pages/barbero/dashboard-barbero";
import CuponesBarbero from "./modules/cliente/pages/barbero/cupones-barbero";
import PerfilBarberiaBarbero from "./modules/cliente/pages/barbero/perfil-barberia-barbero";
import OpinionesBarbero from "./modules/cliente/pages/barbero/opiniones-barbero";
import CitasBarbero from "./modules/cliente/pages/barbero/citas-barbero";
>>>>>>> Stashed changes

function AuthLayout({ children }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── RUTAS PÚBLICAS (Sin menú lateral) ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/verificar-correo" element={<VerificarCorreo />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/crearCupon" element={<CrearCupon />} />
        <Route path="/recuperar-password-enviado" element={<RecuperarPasswordEnviado />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route path="/restablecer-password-exito" element={<RestablecerPasswordExito />} />

        {/* ── RUTAS EXCLUSIVAS DEL OWNER (Dueño - Con su propio Layout) ── */}
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

        {/* ── RUTAS DEL BARBERO (Con menú lateral negro de usuario) ── */}
<<<<<<< Updated upstream
        <Route 
          path="/barbero/inicio" 
          element={
            <BarberoLayout titulo="Inicio">
               <div style={{ padding: '20px' }}>
                 <h2>Bienvenido al Panel de Barbero</h2>
                 <p>Aquí irá tu vista principal de inicio.</p>
               </div>
            </BarberoLayout>
          } 
        />
        <Route path="/seguimiento-servicio/:citaId?" element={<SeguimientoServicio />} />        
=======
        <Route
          path="/barbero/inicio"
          element={<BarberoLayout titulo="Panel del barbero"><DashboardBarbero /></BarberoLayout>}
        />
        <Route
          path="/barbero/citas"
          element={<BarberoLayout titulo="Gestión de citas"><CitasBarbero /></BarberoLayout>}
        />
        <Route
          path="/barbero/cupones"
          element={<BarberoLayout titulo="Cupones"><CuponesBarbero /></BarberoLayout>}
        />
        <Route
          path="/barbero/perfil"
          element={<BarberoLayout titulo="Perfil barbería"><PerfilBarberiaBarbero /></BarberoLayout>}
        />
        <Route
          path="/barbero/opiniones"
          element={<BarberoLayout titulo="Opiniones"><OpinionesBarbero /></BarberoLayout>}
        />
        <Route
          path="/barbero/seguimiento"
          element={<BarberoLayout titulo="Seguimiento"><SeguimientoServicio /></BarberoLayout>}
        />
        <Route
          path="/seguimiento-servicio/:citaId?"
          element={<BarberoLayout titulo="Seguimiento"><SeguimientoServicio /></BarberoLayout>}
        />
>>>>>>> Stashed changes

        {/* ── RUTAS DEL CLIENTE (Con menú lateral negro de usuario) ── */}
        <Route path="/explorar" element={<AuthLayout><Explorar /></AuthLayout>} />
        {/* Aquí está el componente correcto para la vista del cliente 👇 */}
        <Route path="/barberia-perfil/:id" element={<BarberiaPerfilComponent />} />
        <Route path="/barberia/:id/servicios" element={<MasServicios />} />
        <Route path="/agenda-local" element={<AgendaLocal />} />
        <Route path="/datos-reserva" element={<DatosReserva />} />
        <Route path="/cita-confirmada" element={<CitaConfirmada />} />
        <Route path="/mis-citas" element={<AuthLayout><MisCitas /></AuthLayout>} />
        <Route path="/cita/:id" element={<DetalleCita />} />
        <Route path="/opinion-barberia" element={<OpinionBarberia />} />
        <Route path="/opinion-barbero" element={<OpinionBarbero />} />
        <Route path="/historial-citas" element={<AuthLayout><HistorialCitas /></AuthLayout>} />
        <Route path="/favoritos" element={<AuthLayout><Favoritos /></AuthLayout>} />
        <Route path="/notificaciones" element={<AuthLayout><Notificaciones /></AuthLayout>} />
        <Route path="/ajustes" element={<AuthLayout><Ajustes /></AuthLayout>} />
        <Route path="/opinion-barberia-general" element={<OpinionBarberiaGeneral />} />
        <Route path="/comentario-enviado" element={<ComentarioEnviado />} />
        <Route path="/pago-anticipo" element={<PagoAnticipo />} />
      </Routes>
    </BrowserRouter>
  );
}
