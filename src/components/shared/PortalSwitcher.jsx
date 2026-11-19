import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { portalesDisponibles } from "../../constants/portales";

// Menú para cambiar de portal sin cerrar sesión. Solo aparece si la persona
// tiene más de un portal disponible (por ejemplo Usuario + Maestro).
export default function PortalSwitcher() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const portales = portalesDisponibles(profile);
  if (portales.length <= 1) return null;

  const actual = portales.find((p) => p.path === pathname) ?? portales[0];

  const ir = (path) => {
    setAbierto(false);
    if (path !== pathname) navigate(path);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
      >
        {actual.label}
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <>
          {/* Capa para cerrar al tocar fuera */}
          <button
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setAbierto(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Cambiar de portal
            </p>
            {portales.map((p) => {
              const activo = p.key === actual.key;
              return (
                <button
                  key={p.key}
                  role="menuitem"
                  onClick={() => ir(p.path)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                    activo ? "font-bold text-slate-800" : "font-medium text-slate-600"
                  }`}
                >
                  {p.label}
                  {activo && (
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
