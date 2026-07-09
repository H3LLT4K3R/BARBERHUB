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
import BarberiaPerfilComponent from "./modules/cliente/pages/barberia-perfil";

// Componente Layout del Cliente
import SidebarLayout from "./modules/cliente/components/sidebar-layout";

// --- VISTAS DE LAS BARBERÍAS ---
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


function AuthLayout({ children }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (sin sidebar) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/verificar-correo" element={<VerificarCorreo />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/crearCupon" element={<CrearCupon />} />
        <Route path="/recuperar-password-enviado" element={<RecuperarPasswordEnviado />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route path="/restablecer-password-exito" element={<RestablecerPasswordExito />} />

        {/* ── RUTAS EXCLUSIVAS DEL OWNER (Dueño) ── */}
        
        {/* 👇 Aquí movimos PerfilBarberia y lo envolvimos con OwnerLayout */}
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

        {/* ── RUTAS DEL CLIENTE (Con menú lateral negro) ── */}
        <Route path="/explorar" element={<AuthLayout><Explorar /></AuthLayout>} />
        <Route path="/barberia/:id/servicios" element={<AuthLayout><MasServicios /></AuthLayout>} />
        <Route path="/barberia-perfil/:id" element={<AuthLayout><BarberiaPerfilComponent /></AuthLayout>} />
        <Route path="/agenda-local" element={<AuthLayout><AgendaLocal /></AuthLayout>} />
        <Route path="/datos-reserva" element={<AuthLayout><DatosReserva /></AuthLayout>} />
        <Route path="/cita-confirmada" element={<AuthLayout><CitaConfirmada /></AuthLayout>} />
        <Route path="/mis-citas" element={<AuthLayout><MisCitas /></AuthLayout>} />
        <Route path="/cita/:id" element={<AuthLayout><DetalleCita /></AuthLayout>} />
        <Route path="/opinion-barberia" element={<AuthLayout><OpinionBarberia /></AuthLayout>} />
        <Route path="/opinion-barbero" element={<AuthLayout><OpinionBarbero /></AuthLayout>} />
        <Route path="/historial-citas" element={<AuthLayout><HistorialCitas /></AuthLayout>} />
        <Route path="/favoritos" element={<AuthLayout><Favoritos /></AuthLayout>} />
        <Route path="/notificaciones" element={<AuthLayout><Notificaciones /></AuthLayout>} />
        <Route path="/ajustes" element={<AuthLayout><Ajustes /></AuthLayout>} />
        <Route path="/opinion-barberia-general" element={<AuthLayout><OpinionBarberiaGeneral /></AuthLayout>} />
        <Route path="/comentario-enviado" element={<AuthLayout><ComentarioEnviado /></AuthLayout>} />
        <Route path="/pago-anticipo" element={<AuthLayout><PagoAnticipo /></AuthLayout>} />
      </Routes>
    </BrowserRouter>
  );
}