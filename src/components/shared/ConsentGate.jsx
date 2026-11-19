import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import { aceptarConsentimientos } from "../../services/privacidadService";
import { VERSION_LEGAL, CONSENTIMIENTOS_VACIOS, todosAceptados } from "../../constants/legal";
import ConsentCheckboxes from "./ConsentCheckboxes";

// Si la persona aún no aceptó la versión vigente de los textos legales (cuentas creadas
// antes de esta función, o después de un cambio importante), se le pide antes de continuar.
// Quien se acaba de registrar ya los aceptó, así que no ve esta pantalla.
export default function ConsentGate({ children }) {
  const { profile } = useAuth();
  const [valores, setValores] = useState(CONSENTIMIENTOS_VACIOS);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Sin perfil todavía (registro en curso): no se bloquea nada
  if (!profile || profile.consentimientos?.version === VERSION_LEGAL) return children;

  const continuar = async () => {
    if (!todosAceptados(valores)) {
      setError("Debes aceptar los tres puntos para continuar.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await aceptarConsentimientos(profile.uid);
      // AuthContext recibe el perfil actualizado y esta pantalla se cierra sola
    } catch {
      setError("No se pudo guardar tu aceptación. Intenta de nuevo.");
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h1 className="mb-1 text-lg font-bold text-slate-800">Antes de continuar</h1>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">
          Actualizamos cómo cuidamos tus datos personales, de acuerdo con la Ley N° 29733.
          Revisa y acepta para seguir usando UP JAS AQP.
        </p>

        <ConsentCheckboxes
          value={valores}
          onChange={(v) => { setValores(v); setError(""); }}
          error={error}
        />

        <button
          onClick={continuar}
          disabled={guardando}
          className="mt-5 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #1a4270, #2d69a3)" }}
        >
          {guardando ? "Guardando..." : "Aceptar y continuar"}
        </button>
        <button
          onClick={logoutUser}
          className="mt-2 w-full py-2.5 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
        >
          No acepto — cerrar sesión
        </button>
      </div>
    </div>
  );
}
