import { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { IconMail } from "@tabler/icons-react";

import { apiFetch } from "../../../utils/api.js";
import PageNavbar from "../components/page-navbar";
import "../styles/verificar-correo.css";



const CODIGO_LENGTH = 6;

const EXPIRACION_SEG = 195;



function formatearTiempo(segundos) {

  const m = Math.floor(segundos / 60);

  const s = segundos % 60;

  return `${m}:${String(s).padStart(2, "0")}`;

}



export default function VerificarCorreo() {

  const navigate = useNavigate();

  const { state } = useLocation();

  const email = state?.email ?? "";



  const inputRefs = useRef([]);

  const [digitos, setDigitos] = useState(Array(CODIGO_LENGTH).fill(""));

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [restante, setRestante] = useState(EXPIRACION_SEG);

  const [reenviando, setReenviando] = useState(false);



  useEffect(() => {

    if (!email) {

      navigate("/registro", { replace: true });

      return;

    }



    apiFetch("/auth/enviar-codigo", {

      method: "POST",

      body: JSON.stringify({ email }),

    }).catch((err) => {

      if (err.status !== 400) {

        setError(err.message);

      }

    });

  }, [email, navigate]);



  useEffect(() => {

    if (restante <= 0) return;

    const id = setInterval(() => setRestante((t) => t - 1), 1000);

    return () => clearInterval(id);

  }, [restante]);



  const actualizarDigito = (index, valor) => {

    const num = valor.replace(/\D/g, "").slice(-1);

    const next = [...digitos];

    next[index] = num;

    setDigitos(next);

    setError("");

    if (num && index < CODIGO_LENGTH - 1) {

      inputRefs.current[index + 1]?.focus();

    }

  };



  const onKeyDown = (index, e) => {

    if (e.key === "Backspace" && !digitos[index] && index > 0) {

      inputRefs.current[index - 1]?.focus();

    }

  };



  const onPaste = (e) => {

    e.preventDefault();

    const texto = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODIGO_LENGTH);

    if (!texto) return;

    const next = Array(CODIGO_LENGTH).fill("");

    texto.split("").forEach((c, i) => {

      next[i] = c;

    });

    setDigitos(next);

    const focusIdx = Math.min(texto.length, CODIGO_LENGTH - 1);

    inputRefs.current[focusIdx]?.focus();

  };



  const reenviarCodigo = async () => {

    setReenviando(true);

    setError("");

    try {

      await apiFetch("/auth/reenviar-codigo", {

        method: "POST",

        body: JSON.stringify({ email }),

      });

      setDigitos(Array(CODIGO_LENGTH).fill(""));

      setRestante(EXPIRACION_SEG);

    } catch (err) {

      setError(err.message);

    } finally {

      setReenviando(false);

    }

  };



  const verificar = async (e) => {

    e.preventDefault();

    const codigoIngresado = digitos.join("");



    if (codigoIngresado.length !== CODIGO_LENGTH) {

      setError("Ingresa los 6 dígitos del código.");

      return;

    }



    if (restante <= 0) {

      setError("El código expiró. Solicita uno nuevo.");

      return;

    }



    setLoading(true);

    setError("");



    try {

      const data = await apiFetch("/auth/verificar-codigo", {

        method: "POST",

        body: JSON.stringify({ email, codigo: codigoIngresado }),

      });



      navigate("/login", {

        state: {

          email,

          cuentaVerificada: true,

          mensaje: data.mensaje || "Correo verificado. Ya puedes iniciar sesión.",

        },

      });

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };



  const codigoCompleto = digitos.every((d) => d !== "");



  if (!email) {

    return null;

  }



  return (
    <div className="vc-page">
      <PageNavbar />
      <div className="vc-body">
      <div className="vc-card">

        <div className="vc-icon-wrap" aria-hidden>

          <IconMail size={32} stroke={1.5} color="#111" />

        </div>



        <h1 className="vc-title">Verifica tu correo</h1>



        <p className="vc-text">

          Enviamos un código de 6 dígitos a

        </p>

        <p className="vc-email">{email}</p>

        <p className="vc-text vc-text--sub">

          Ingresa el código para continuar

        </p>



        <form className="vc-form" onSubmit={verificar}>

          <div className="vc-code-row" onPaste={onPaste}>

            {digitos.map((d, i) => (

              <input

                key={i}

                ref={(el) => {

                  inputRefs.current[i] = el;

                }}

                className="vc-code-input"

                type="text"

                inputMode="numeric"

                maxLength={1}

                value={d}

                aria-label={`Dígito ${i + 1}`}

                autoComplete={i === 0 ? "one-time-code" : "off"}

                autoFocus={i === 0}

                placeholder="•"

                onChange={(e) => actualizarDigito(i, e.target.value)}

                onKeyDown={(e) => onKeyDown(i, e)}

              />

            ))}

          </div>



          {error && <p className="vc-error">{error}</p>}



          <button

            type="submit"

            className="vc-btn-verify"

            disabled={loading || !codigoCompleto || restante <= 0}

          >

            {loading ? "Verificando..." : "Verificar código"}

          </button>

        </form>



        <p className="vc-resend">

          ¿No recibiste el código?{" "}

          <button

            type="button"

            className="vc-link-gold"

            onClick={reenviarCodigo}

            disabled={reenviando}

          >

            {reenviando ? "Enviando..." : "Reenviar"}

          </button>

        </p>



        <p className="vc-timer">

          {restante > 0

            ? `El código expira en ${formatearTiempo(restante)}`

            : "El código expiró. Solicita uno nuevo."}

        </p>



        <button

          type="button"

          className="vc-back"

          onClick={() => navigate("/registro")}

        >

          Volver al registro

        </button>

      </div>
      </div>
    </div>

  );

}

