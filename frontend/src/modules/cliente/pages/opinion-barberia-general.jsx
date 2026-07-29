import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import { supabase } from "../../../lib/supabase.js";
import "../styles/opinion-barberia-general.css";

export default function OpinionBarberiaGeneral() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const maxCaracteres = 1000;

  if (!state?.appointmentId || !state?.barberiaId) {
    return (
      <div className="opg-page">
        <div className="opg-content">
          <p>Falta información de la cita para dejar una opinión.</p>
          <button className="opg-btn-back" onClick={() => navigate("/historial-citas")}>
            <IconArrowLeft size={17} /> Regresar
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setEnviando(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("reviews").insert({
        appointment_id: state.appointmentId,
        barberia_id: state.barberiaId,
        barber_membership_id: state.barberMembershipId ?? null,
        client_id: (await supabase.auth.getUser()).data.user.id,
        rating,
        comment: comentario.trim() || null,
      });
      if (insertError) throw insertError;

      setEnviado(true);
    } catch (err) {
      setError(err.message === "duplicate key value violates unique constraint \"reviews_appointment_id_key\""
        ? "Ya dejaste una opinión para esta cita."
        : "No fue posible enviar tu opinión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="opg-page">
      <header className="opg-header">
        <img src="/logo.png" alt="Barber Hub" className="opg-logo-barberhub" />
      </header>

      <div className="opg-content">
        <h1 className="opg-title">
          Valora tu experiencia
          <br />
          con nosotros
        </h1>

        <div className="opg-card">
          <form className="opg-form" onSubmit={handleSubmit}>
            <div className="opg-divider" />
            <h2 className="opg-barberia-name">{state.establecimiento ?? "Tu barbería"}</h2>
            <p className="opg-form-subtitle">Valora el servicio recibido</p>

            <div className="opg-stars" role="radiogroup" aria-label="Calificación con estrellas">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const activeStar = hoverRating ? starIndex <= hoverRating : starIndex <= rating;
                return (
                  <button
                    key={starIndex}
                    type="button"
                    className={`opg-star-btn ${activeStar ? "filled" : ""}`}
                    onClick={() => setRating(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Calificar ${starIndex} de 5 estrellas`}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            <div className="opg-comment-wrapper">
              <textarea
                className="opg-comment-textarea"
                maxLength={maxCaracteres}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe tu comentario aquí... Comparte tu experiencia con el servicio, la atención o las instalaciones."
                rows={5}
                disabled={enviado}
              />
              <span className="opg-char-counter">
                {comentario.length}/{maxCaracteres}
              </span>
            </div>

            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

            {enviado ? (
              <div className="opg-success-msg">
                ✓ ¡Gracias! Tu opinión ha sido enviada con éxito.
              </div>
            ) : (
              <button type="submit" className="opg-submit-btn" disabled={enviando}>
                {enviando ? "ENVIANDO..." : "ENVIAR OPINIÓN"}
              </button>
            )}
          </form>
        </div>

        <div className="opg-footer-actions">
          <button type="button" className="opg-btn-back" onClick={() => navigate("/historial-citas")}>
            <IconArrowLeft size={17} aria-hidden="true" />
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
}
