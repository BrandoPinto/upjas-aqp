import { useEffect } from "react";
import { createPortal } from "react-dom";
import { TEXTOS_LEGALES } from "../../constants/legal";

// Muestra uno de los textos legales ("privacidad" | "terminos" | "datos").
// Se dibuja en <body> para quedar por encima de cualquier panel con transformaciones.
export default function LegalModal({ k, onCerrar }) {
  const texto = TEXTOS_LEGALES[k];

  useEffect(() => {
    if (!texto) return;
    const onKey = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [texto, onCerrar]);

  if (!texto) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:px-4">
      <button aria-label="Cerrar" className="absolute inset-0 cursor-default" onClick={onCerrar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={texto.titulo}
        className="relative flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-5">
          <h2 className="text-base font-bold leading-snug text-slate-800">{texto.titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {texto.secciones.map((s) => (
            <div key={s.t} className="mb-3 rounded-xl bg-slate-50 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.t}</p>
              <p className="text-xs leading-relaxed text-slate-600">{s.p}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-5 pb-5 pt-3">
          <button
            onClick={onCerrar}
            className="w-full rounded-2xl bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
