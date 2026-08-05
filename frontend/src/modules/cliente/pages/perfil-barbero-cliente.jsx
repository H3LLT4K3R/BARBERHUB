import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IconArrowLeft, IconStarFilled, IconUser } from "@tabler/icons-react";
import AppNavbar from "../components/app-navbar";
import { supabase } from "../../../lib/supabase.js";
import "../styles/perfil-barbero-cliente.css";

function urlPublica(path) {
  if (!path) return null;
  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

export default function PerfilBarberoCliente() {
  const { membershipId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const volverA = location.state?.volverA ?? "/explorar";

  const [barbero, setBarbero] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [stats, setStats] = useState({ rating: 0, total: 0 });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const { data: membership } = await supabase
        .from("barberia_memberships")
        .select("id, display_name, specialty, profile_id, barberia_id, barberias(name), profiles!profile_id(full_name, avatar_path)")
        .eq("id", membershipId)
        .eq("role", "barber")
        .eq("is_active", true)
        .maybeSingle();

      if (cancelado) return;
      if (!membership) {
        setCargando(false);
        return;
      }

      const [{ data: portafolio }, { data: reviews }] = await Promise.all([
        supabase.from("barber_portfolio_images").select("id, image_path").eq("membership_id", membershipId).order("created_at", { ascending: false }),
        supabase.from("reviews").select("rating").eq("barber_membership_id", membershipId).eq("is_published", true),
      ]);

      if (cancelado) return;

      const calificaciones = reviews ?? [];
      setBarbero(membership);
      setFotos(portafolio ?? []);
      setStats({
        rating: calificaciones.length ? calificaciones.reduce((acc, r) => acc + r.rating, 0) / calificaciones.length : 0,
        total: calificaciones.length,
      });
      setCargando(false);
    }

    cargar();
    return () => { cancelado = true; };
  }, [membershipId]);

  if (cargando) {
    return (
      <div className="pbc-pagina">
        <AppNavbar />
        <main className="pbc-contenido"><p>Cargando...</p></main>
      </div>
    );
  }

  if (!barbero) {
    return (
      <div className="pbc-pagina">
        <AppNavbar />
        <main className="pbc-contenido pbc-contenido--error">
          <h2>Barbero no encontrado</h2>
          <button onClick={() => navigate(volverA)}>Volver</button>
        </main>
      </div>
    );
  }

  const nombre = barbero.display_name ?? barbero.profiles?.full_name ?? "Barbero";
  const avatarUrl = urlPublica(barbero.profiles?.avatar_path);

  return (
    <div className="pbc-pagina">
      <AppNavbar />
      <main className="pbc-contenido">
        <button type="button" className="pbc-boton-regresar" onClick={() => navigate(volverA)}>
          <IconArrowLeft size={18} /> Regresar
        </button>

        <section className="pbc-hero">
          <div className="pbc-avatar-grande">
            {avatarUrl ? <img src={avatarUrl} alt={nombre} /> : <IconUser size={48} />}
          </div>
          <div>
            <h1 className="pbc-nombre">{nombre}</h1>
            {barbero.specialty && <p className="pbc-especialidad">{barbero.specialty}</p>}
            {barbero.barberias?.name && <p className="pbc-barberia">{barbero.barberias.name}</p>}
            <div className="pbc-rating">
              <IconStarFilled size={16} />
              <span>{stats.total ? `${stats.rating.toFixed(1)} (${stats.total} opiniones)` : "Sin opiniones todavía"}</span>
            </div>
          </div>
        </section>

        <section className="pbc-portafolio">
          <h2>Trabajos realizados</h2>
          {fotos.length === 0 ? (
            <p className="pbc-vacio">Este barbero aún no ha subido fotos de sus trabajos.</p>
          ) : (
            <div className="pbc-galeria">
              {fotos.map((f) => (
                <div key={f.id} className="pbc-foto-item">
                  <img src={urlPublica(f.image_path)} alt="Trabajo del barbero" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
