import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { portalesDisponibles } from "../../constants/portales";

// Iconos por portal (trazos de 24x24)
const ICONOS = {
  usuario: ["M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"],
  maestro: [
    "M12 14l9-5-9-5-9 5 9 5z",
    "M12 14l6.16-3.422A12.083 12.083 0 0121 13.5c0 3-4.03 5.5-9 5.5S3 16.5 3 13.5c0-.538.09-1.06.255-1.556L12 14z",
  ],
  lider: ["M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"],
  admin: ["M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"],
};

function IconoPortal({ k, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {(ICONOS[k] ?? ICONOS.usuario).map((d) => (
        <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}

// Selector para cambiar de portal sin cerrar sesión. Solo aparece si la persona
// tiene más de un portal disponible (por ejemplo Usuario + Maestro).
// En celular se abre como hoja inferior; en pantallas grandes, como panel flotante.
export default function PortalSwitcher() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  // Escape cierra la hoja y se bloquea el scroll de la página mientras está abierta
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => { if (e.key === "Escape") setAbierto(false); };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto]);

  const portales = portalesDisponibles(profile);
  if (portales.length <= 1) return null;

  const actual = portales.find((p) => p.path === pathname) ?? portales[0];

  const ir = (path) => {
    setAbierto(false);
    if (path !== pathname) navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        aria-label={`Portal actual: ${actual.label}. Cambiar de portal`}
        className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
      >
        <span className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/40" style={{ background: actual.color }} />
        <span className="hidden min-[440px]:inline">{actual.label}</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Se dibuja en <body> para quedar por encima de la barra inferior y de la cabecera */}
      {abierto && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-start sm:justify-end sm:p-4 sm:pt-16">
          <button
            aria-label="Cerrar"
            className="portal-fondo absolute inset-0 cursor-default bg-black/50"
            onClick={() => setAbierto(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cambiar de portal"
            className="portal-hoja relative w-full rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-2xl sm:w-80 sm:rounded-2xl sm:pb-4"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-slate-800">Cambiar de portal</h2>
              <button
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {portales.map((p) => {
                const activo = p.key === actual.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => ir(p.path)}
                    aria-current={activo ? "page" : undefined}
                    className="flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.98]"
                    style={{
                      borderColor: activo ? p.color : "#e2e8f0",
                      background: activo ? `${p.color}12` : "#ffffff",
                    }}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ background: p.color }}
                    >
                      <IconoPortal k={p.key} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800">{p.label}</span>
                      <span className="block text-xs text-slate-500">{p.descripcion}</span>
                    </span>
                    {activo && (
                      <svg className="h-5 w-5 shrink-0" style={{ color: p.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <style>{`
            @keyframes portalFondo { from { opacity: 0; } to { opacity: 1; } }
            @keyframes portalHoja  { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes portalPop   { from { opacity: 0; transform: translateY(-8px) scale(.97); } to { opacity: 1; transform: none; } }
            .portal-fondo { animation: portalFondo .2s ease both; }
            .portal-hoja  { animation: portalHoja .28s cubic-bezier(.2,.8,.2,1) both; }
            @media (min-width: 640px) { .portal-hoja { animation: portalPop .18s ease both; } }
            @media (prefers-reduced-motion: reduce) {
              .portal-fondo, .portal-hoja { animation: none; }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}
