import { useEffect, useRef, useState } from "react";
import { suscribirToasts, mostrarToast, mensajeDeError } from "../../services/toast";

const DURACION_MS = 4500;

const ESTILOS = {
  error: { fondo: "#fef2f2", borde: "#fecaca", texto: "#b91c1c", icono: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" },
  ok:    { fondo: "#f0fdf4", borde: "#bbf7d0", texto: "#15803d", icono: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  info:  { fondo: "#eff6ff", borde: "#bfdbfe", texto: "#1d4ed8", icono: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" },
};

// Errores del navegador que no son un problema real de la app
const IGNORADOS = ["ResizeObserver loop", "Script error"];

// Dibuja los avisos y, además, atrapa cualquier error inesperado que no haya
// sido manejado en el código: avisa a la persona en vez de dejar la app "muda".
export default function Toaster() {
  const [avisos, setAvisos] = useState([]);
  const ultimo = useRef({ texto: "", t: 0 });
  const contador = useRef(0);

  useEffect(() => {
    const agregar = ({ texto, tipo }) => {
      // Evita repetir el mismo aviso varias veces seguidas
      const ahora = Date.now();
      if (ultimo.current.texto === texto && ahora - ultimo.current.t < 3000) return;
      ultimo.current = { texto, t: ahora };

      const id = ++contador.current;
      setAvisos((prev) => [...prev.slice(-2), { id, texto, tipo }]);
      window.setTimeout(() => setAvisos((prev) => prev.filter((a) => a.id !== id)), DURACION_MS);
    };

    const desuscribir = suscribirToasts(agregar);

    const alRechazar = (e) => {
      console.error("Promesa rechazada sin manejar:", e.reason);
      mostrarToast(mensajeDeError(e.reason, "Ocurrió un error inesperado. Intenta de nuevo."));
    };
    const alFallar = (e) => {
      const msg = String(e.message ?? "");
      if (!e.error || IGNORADOS.some((x) => msg.includes(x))) return;
      console.error("Error sin manejar:", e.error);
      mostrarToast("Ocurrió un error inesperado. Intenta de nuevo.");
    };

    window.addEventListener("unhandledrejection", alRechazar);
    window.addEventListener("error", alFallar);
    return () => {
      desuscribir();
      window.removeEventListener("unhandledrejection", alRechazar);
      window.removeEventListener("error", alFallar);
    };
  }, []);

  if (avisos.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {avisos.map((a) => {
        const e = ESTILOS[a.tipo] ?? ESTILOS.error;
        return (
          <div
            key={a.id}
            role={a.tipo === "error" ? "alert" : "status"}
            className="toast-aviso pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl"
            style={{ background: e.fondo, borderColor: e.borde, color: e.texto }}
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={e.icono} />
            </svg>
            <span className="min-w-0 break-words">{a.texto}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes toastAviso { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .toast-aviso { animation: toastAviso .25s ease both; }
        @media (prefers-reduced-motion: reduce) { .toast-aviso { animation: none; } }
      `}</style>
    </div>
  );
}
