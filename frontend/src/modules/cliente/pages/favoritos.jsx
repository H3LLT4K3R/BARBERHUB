import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { supabase } from "../../../lib/supabase.js";
import "../styles/favoritos.css";

export default function Favoritos() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) {
        setCargando(false);
        return;
      }

      const { data } = await supabase
        .from("favorite_barberias")
        .select("barberia_id, barberias(id, name, address_line1, city)")
        .eq("profile_id", uid);

      if (cancelado) return;

      const barberiasBase = (data ?? []).map((f) => f.barberias).filter(Boolean);
      const ids = barberiasBase.map((b) => b.id);
      const { data: publicas } = ids.length
        ? await supabase.from("barberias_public").select("id, rating").in("id", ids)
        : { data: [] };

      const ratingsPorId = new Map((publicas ?? []).map((p) => [p.id, p.rating]));
      setFavoritos(barberiasBase.map((b) => ({ ...b, rating: ratingsPorId.get(b.id) ?? 0 })));
      setCargando(false);
    }

    cargar();
    return () => { cancelado = true; };
  }, []);

  const manejarAgendar = (e, barberiaId) => {
    e.stopPropagation();
    navigate("/agenda-local", { state: { barberiaId, volverA: "/favoritos" } });
  };

  const manejarVerBarberia = (e, barberiaId) => {
    e.stopPropagation();
    navigate(`/barberia-perfil/${barberiaId}`, { state: { volverA: "/favoritos" } });
  };

  const quitarDeFavoritos = async (e, barberiaId) => {
    e.stopPropagation();
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    await supabase.from("favorite_barberias").delete().eq("profile_id", uid).eq("barberia_id", barberiaId);
    setFavoritos((actuales) => actuales.filter((b) => b.id !== barberiaId));
  };

  if (cargando) {
    return <div className="fav-dashboard"><p style={{ padding: 24 }}>Cargando favoritos...</p></div>;
  }

  return (
    <div className="fav-dashboard">
      <div className="fav-main-wrapper">
        <main className="fav-content-layout">
          <div className="fav-cards-container">
            {favoritos.map((barberia) => (
              <div key={barberia.id} className="fav-tarjeta">
                <div className="fav-info">
                  <h3>{barberia.name}</h3>
                  <p className="fav-direccion">{barberia.address_line1}, {barberia.city}</p>
                </div>

                <div className="fav-acciones">
                  <div className="fav-cabecera-acciones">
                    <button
                      type="button"
                      className="fav-boton-quitar"
                      onClick={(e) => quitarDeFavoritos(e, barberia.id)}
                      aria-label={`Quitar ${barberia.name} de favoritos`}
                      title="Quitar de favoritos"
                    >
                      <Heart size={20} fill="currentColor" aria-hidden="true" />
                    </button>
                    <span className="fav-calificacion">{Number(barberia.rating).toFixed(1)}</span>
                  </div>
                  <div className="fav-grupo-botones">
                    <button className="fav-boton dorado" onClick={(e) => manejarAgendar(e, barberia.id)}>
                      Agendar
                    </button>
                    <button className="fav-boton gris" onClick={(e) => manejarVerBarberia(e, barberia.id)}>
                      Ver barbería
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {favoritos.length === 0 && (
              <p className="fav-vacio">Aún no tienes barberías favoritas.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
