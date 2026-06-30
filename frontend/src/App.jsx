import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- IMPORTS CORREGIDOS ---
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
import MisCitas from "./modules/cliente/pages/mis-citas"; // <-- Añadido porque faltaba
import BarberiaPerfilComponent from "./modules/cliente/pages/barberia-perfil";
// Componentes
import SidebarLayout from "./modules/cliente/components/sidebar-layout";

// Vistas de Owner
import OwnerFinanzas from "./modules/cliente/pages/owner/owner-finanzas";
import OwnerInventario from "./modules/cliente/pages/owner/owner-inventario";

//vistas de las barberias
import PerfilBarberia from "./modules/cliente/pages/Barberias/perfilBarberia";
import CrearCupon from "./modules/cliente/pages/Barberias/crearCupon";


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
        <Route path="/perfilBarberia" element={<PerfilBarberia />} />
        <Route path="/crearCupon" element={<CrearCupon />} />
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

        {/* Rutas con sidebar */}
        <Route
          path="/explorar"
          element={
            <AuthLayout>
              <Explorar />
            </AuthLayout>
          }
        />
        <Route
          path="/barberia/:id/servicios"
          element={
            <AuthLayout>
              <MasServicios />
            </AuthLayout>
          }
        />

        <Route
          path="/barberia-perfil/:id"
          element={
            <AuthLayout>
              <BarberiaPerfilComponent />
            </AuthLayout>
          }
        />

        <Route
          path="/agenda-local"
          element={
            <AuthLayout>
              <AgendaLocal />
            </AuthLayout>
          }
        />

        <Route
          path="/datos-reserva"
          element={
            <AuthLayout>
              <DatosReserva />
            </AuthLayout>
          }
        />

        <Route
          path="/cita-confirmada"
          element={
            <AuthLayout>
              <CitaConfirmada />
            </AuthLayout>
          }
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
          element={
            <AuthLayout>
              <DetalleCita />
            </AuthLayout>
          }
        />

        <Route
          path="/opinion-barberia"
          element={
            <AuthLayout>
              <OpinionBarberia />
            </AuthLayout>
          }
        />

        <Route
          path="/opinion-barbero"
          element={
            <AuthLayout>
              <OpinionBarbero />
            </AuthLayout>
          }
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
          element={
            <AuthLayout>
              <OpinionBarberiaGeneral />
            </AuthLayout>
          }
        />

        <Route
          path="/comentario-enviado"
          element={
            <AuthLayout>
              <ComentarioEnviado />
            </AuthLayout>
          }
        />

        <Route
          path="/owner-finanzas"
          element={
            <AuthLayout>
              <OwnerFinanzas />
            </AuthLayout>
          }
        />

        <Route
          path="/pago-anticipo"
          element={
            <AuthLayout>
              <PagoAnticipo />
            </AuthLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}