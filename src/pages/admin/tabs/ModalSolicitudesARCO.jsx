import { useEffect, useState } from "react";
import { getSolicitudesARCO, marcarSolicitudARCO } from "../../../services/privacidadService";

const ETIQUETA_TIPO = {
  oposicion: "Oposición", rectificacion: "Rectificación", acceso: "Acceso",
  cancelacion: "Cancelación", otro: "Otra consulta",
};

function fecha(ts) {
  const d = ts?.toDate?.();
  return d ? d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

// Solicitudes de privacidad (derechos ARCO) enviadas por los usuarios
export default function ModalSolicitudesARCO({ onCerrar }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState("");
  const [guardando, setGuardando]     = useState(null);

  useEffect(() => {
    getSolicitudesARCO()
      .then(setSolicitudes)
      .catch(() => setError("No se pudieron cargar las solicitudes."))
      .finally(() => setCargando(false));
  }, []);

  const cambiarEstado = async (s, estado) => {
    setGuardando(s.id);
    try {
      await marcarSolicitudARCO(s.id, estado);
      setSolicitudes((prev) => prev.map((x) => (x.id === s.id ? { ...x, estado } : x)));
    } catch {
      setError("No se pudo actualizar la solicitud.");
    } finally {
      setGuardando(null);
    }
  };

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4" onClick={onCerrar}>
      <div
        className="flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-4 pt-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Privacidad (ARCO)</p>
            <p className="mt-0.5 font-bold text-slate-800">Solicitudes de usuarios</p>
            <p className="text-xs text-slate-400">{pendientes} pendiente{pendientes === 1 ? "" : "s"}</p>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-600">{error}</p>}

          {cargando ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
            </div>
          ) : solicitudes.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No hay solicitudes</p>
          ) : (
            <div className="flex flex-col gap-3">
              {solicitudes.map((s) => {
                const pendiente = s.estado === "pendiente";
                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl border p-3.5 ${pendiente ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-slate-800">{s.nombre || "Sin nombre"}</p>
                        <p className="break-all text-xs text-slate-500">{s.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        pendiente ? "bg-amber-200 text-amber-800" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {pendiente ? "Pendiente" : "Atendida"}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {ETIQUETA_TIPO[s.tipo] ?? s.tipo} · {fecha(s.creadaEn)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{s.detalle}</p>

                    <button
                      onClick={() => cambiarEstado(s, pendiente ? "atendida" : "pendiente")}
                      disabled={guardando === s.id}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {guardando === s.id ? "Guardando..." : pendiente ? "Marcar como atendida" : "Volver a pendiente"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 pb-5 pt-3">
          <button
            onClick={onCerrar}
            className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
