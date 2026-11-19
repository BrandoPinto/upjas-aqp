import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebaseConfig";
import {
  collection, query, orderBy, limit, startAfter, getDocs,
} from "firebase/firestore";
import { obtenerDescripcion } from "../../../services/puntosService";

const PAGE_SIZE = 10;

const TIPO_META = {
  asistencia:       { emoji: "📚", bg: "bg-emerald-100", text: "text-emerald-700" },
  actividadPequena: { emoji: "🎯", bg: "bg-blue-100",    text: "text-blue-700"   },
  actividadGrande:  { emoji: "🏆", bg: "bg-violet-100",  text: "text-violet-700" },
  invitacion:       { emoji: "🤝", bg: "bg-orange-100",  text: "text-orange-700" },
  plus:             { emoji: "⭐", bg: "bg-amber-100",   text: "text-amber-700"  },
  gasto:            { emoji: "💸", bg: "bg-red-100",     text: "text-red-600"    },
};

const ROL_LABEL = {
  maestro: "Maestro",
  lider:   "Líder",  admin:   "Admin",
};

function formatFecha(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

export default function HistorialPuntos({ uid, puntos }) {
  const [entradas, setEntradas]       = useState([]);
  const [cursor, setCursor]           = useState(null);
  const [hayMas, setHayMas]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "users", uid, "historialPuntos"),
          orderBy("fecha", "desc"),
          limit(PAGE_SIZE)
        );
        const snap = await getDocs(q);
        setEntradas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCursor(snap.docs[snap.docs.length - 1] ?? null);
        setHayMas(snap.docs.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [uid]);

  const cargarMas = async () => {
    if (!cursor || cargandoMas) return;
    setCargandoMas(true);
    try {
      const q = query(
        collection(db, "users", uid, "historialPuntos"),
        orderBy("fecha", "desc"),
        startAfter(cursor),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      setEntradas((prev) => [...prev, ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))]);
      setCursor(snap.docs[snap.docs.length - 1] ?? null);
      setHayMas(snap.docs.length === PAGE_SIZE);
    } finally {
      setCargandoMas(false);
    }
  };

  return (
    <div className="flex flex-col pb-8">

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-lg font-bold text-white">Historial de Puntos</h2>
        <p className="text-xs text-white/60 mt-0.5">⭐ {puntos ?? 0} pts acumulados</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-100 border-t-blue-500" />
        </div>
      ) : entradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-5xl">⭐</span>
          <p className="text-sm text-slate-400 font-medium">Aún no tienes puntos registrados</p>
          <p className="text-xs text-slate-300">Asiste a clases y eventos para ganar puntos</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {entradas.map((e, i) => {
              const meta = TIPO_META[e.tipo] ?? { emoji: "⭐", bg: "bg-slate-100", text: "text-slate-600" };
              const esGasto = (e.valor ?? 0) < 0;
              return (
                <div
                  key={e.id}
                  className={`flex items-start gap-3 px-4 py-3.5${i < entradas.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl text-xl ${meta.bg}`}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Primero el nombre del evento; el tipo de actividad va en segundo plano */}
                    <p className="text-sm font-semibold text-slate-800 leading-snug break-words">
                      {e.eventoTitulo ?? e.descripcion ?? e.tipo}
                    </p>
                    {e.eventoTitulo && (
                      <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">
                        {obtenerDescripcion(e.tipo)}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatFecha(e.fecha)}
                      {e.rolOtorgante && (
                        <span className="ml-1.5 before:content-['·'] before:mr-1.5">
                          {ROL_LABEL[e.rolOtorgante] ?? e.rolOtorgante}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-sm font-bold ${esGasto ? "text-red-500" : meta.text}`}>
                    {esGasto ? "" : "+"}{e.valor} pts
                  </span>
                </div>
              );
            })}
          </div>

          {hayMas && (
            <button
              onClick={cargarMas}
              disabled={cargandoMas}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cargandoMas
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                : "Cargar más"
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}
