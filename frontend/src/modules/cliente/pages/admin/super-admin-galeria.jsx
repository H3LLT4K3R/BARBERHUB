import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { apiFetch } from "../../../../utils/api.js";
import { supabase } from "../../../../lib/supabase.js";

function urlImagenGaleria(imagePath) {
  return supabase.storage.from("perfiles").getPublicUrl(imagePath).data.publicUrl;
}

export default function SuperAdminGaleria() {
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [caption, setCaption] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const imagenInputRef = useRef(null);

  const cargarImagenes = async () => {
    setCargando(true);
    const { data } = await supabase
      .from("landing_gallery_images")
      .select("id, image_path, caption, created_at")
      .order("created_at", { ascending: false });
    setImagenes(data ?? []);
    setCargando(false);
  };

  useEffect(() => {
    cargarImagenes();
  }, []);

  const subirImagen = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!tiposPermitidos.includes(file.type)) {
      setError("Solo se aceptan imágenes JPG, PNG, WEBP o GIF.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5 MB.");
      event.target.value = "";
      return;
    }

    setSubiendo(true);
    setError("");
    setMensaje("");
    try {
      const path = `landing/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("perfiles").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      await apiFetch("/admin/galeria", {
        method: "POST",
        body: JSON.stringify({ imagePath: path, caption: caption.trim() || null }),
      });

      setCaption("");
      setMensaje("Imagen agregada a la ruleta del landing.");
      await cargarImagenes();
    } catch (err) {
      setError(err.message || "No fue posible subir la imagen.");
    } finally {
      setSubiendo(false);
      event.target.value = "";
    }
  };

  const eliminarImagen = async (imagen) => {
    setEliminandoId(imagen.id);
    setError("");
    setMensaje("");
    try {
      await apiFetch(`/admin/galeria/${imagen.id}`, { method: "DELETE" });
      setImagenes((prev) => prev.filter((img) => img.id !== imagen.id));
    } catch (err) {
      setError(err.message || "No fue posible eliminar la imagen.");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="card-white-container">
      <div className="owner-usuarios-card-header">
        <ImageIcon size={24} color="#D4AF37" />
        <h2 className="owner-usuarios-card-title">Galería del Landing</h2>
      </div>
      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 0, marginBottom: 16 }}>
        Las imágenes que agregues aquí son las que se muestran en la ruleta del landing (cortes, barbas, fades, etc.). No dependen de que ningún barbero suba nada.
      </p>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#15803d" }}>{mensaje}</p>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <input
          type="text"
          className="owner-usuarios-input"
          style={{ maxWidth: 260 }}
          placeholder="Descripción (opcional, ej. Degradado)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={subiendo}
        />
        <input
          ref={imagenInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={subirImagen}
          disabled={subiendo}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="owner-usuarios-submit-btn"
          style={{ maxWidth: 160, marginTop: 0 }}
          onClick={() => imagenInputRef.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo..." : "Elegir imagen"}
        </button>
      </div>

      {cargando && <p style={{ color: "#6b7280", fontSize: 14 }}>Cargando...</p>}
      {!cargando && imagenes.length === 0 && (
        <p style={{ color: "#6b7280", fontSize: 14 }}>Todavía no hay imágenes en la galería.</p>
      )}

      {!cargando && imagenes.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {imagenes.map((img) => (
            <div key={img.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              <img
                src={urlImagenGaleria(img.image_path)}
                alt={img.caption ?? ""}
                style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
              />
              {img.caption && (
                <span style={{ position: "absolute", left: 8, bottom: 8, padding: "3px 10px", borderRadius: 12, background: "rgba(17,17,17,0.65)", color: "#fff", fontSize: 12 }}>
                  {img.caption}
                </span>
              )}
              <button
                type="button"
                onClick={() => eliminarImagen(img)}
                disabled={eliminandoId === img.id}
                title="Eliminar de la ruleta"
                style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(185,28,28,0.85)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
