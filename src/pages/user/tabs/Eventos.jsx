import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/firebaseConfig";
import { mostrarToast, mensajeDeError } from "../../../services/toast";
import {
  collection, query, getDocs, doc,
  setDoc, getDoc, serverTimestamp, orderBy,
} from "firebase/firestore";

// Caché de módulo: persiste mientras la SPA no recarga
let _eventosCache = null;
const _asistenciasCache = {}; // { [uid]: { [eventoId]: bool } }

// ── Íconos ────────────────────────────────────────────────────────────────────
const IcCal = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
  </svg>
);
const IcClock = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IcPin = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const IcStar = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const IcCheck = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const IcX = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IcBack = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);
const IcInfo = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

// ── Colores por categoría ─────────────────────────────────────────────────────
const CAT_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", accent: "#7C3AED", light: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
  { bg: "bg-blue-100",   text: "text-blue-700",   accent: "#2563EB", light: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.2)"  },
  { bg: "bg-rose-100",   text: "text-rose-700",   accent: "#E11D48", light: "rgba(225,29,72,0.08)",  border: "rgba(225,29,72,0.2)"  },
  { bg: "bg-emerald-100",text: "text-emerald-700",accent: "#059669", light: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.2)"  },
  { bg: "bg-amber-100",  text: "text-amber-700",  accent: "#D97706", light: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.2)"  },
];
const getCatColor = (cat) =>
  CAT_COLORS[(cat?.charCodeAt(0) ?? 0) % CAT_COLORS.length];

// Formatea fecha "2025-04-27" → "27/4/2025"
function formatFecha(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${parseInt(d)}/${parseInt(m)}/${y}`;
}

// ── Modal confirmación de asistencia (2 pasos) ────────────────────────────────
function ModalAsistencia({ evento, onConfirmar, onCerrar, confirmando }) {
  const [paso, setPaso]     = useState(0);
  const [aceptado, setAceptado] = useState(false);
  const cc = getCatColor(evento.categoria);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* ── Paso 0: Detalle del evento ── */}
        {paso === 0 && (
          <>
            <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-2 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: cc.accent }}>
                  Confirmar asistencia
                </p>
                <h3 className="font-bold text-slate-800 text-base leading-snug">{evento.titulo}</h3>
              </div>
              <button onClick={onCerrar}
                className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition">
                <IcX />
              </button>
            </div>

            {/* Imagen */}
            {evento.imagen && (
              <div className="mx-5 mb-3 rounded-2xl overflow-hidden h-36 flex-shrink-0">
                <img src={evento.imagen} alt={evento.titulo}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.parentElement.style.display = "none"; }} />
              </div>
            )}

            {/* Info grid */}
            <div className="px-5 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { icon: <IcCal />,   label: "Fecha",     val: formatFecha(evento.fecha) },
                  { icon: <IcClock />, label: "Hora",      val: evento.hora || "Por confirmar" },
                  { icon: <IcPin />,   label: "Lugar",     val: evento.lugar || "Por confirmar" },
                  { icon: <IcStar />,  label: "Puntos",    val: evento.tipoPuntos ? evento.tipoPuntos.charAt(0).toUpperCase() + evento.tipoPuntos.slice(1).replace(/([A-Z])/g, " $1") : "Sin puntos" },
                ].map(({ icon, label, val }) => (
                  <div key={label} className={`bg-slate-50 rounded-xl px-3 py-2.5 ${label === "Lugar" ? "col-span-2" : ""}`}>
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                      {icon}
                      <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 break-words">{val}</p>
                  </div>
                ))}
              </div>

              {evento.descripcion && (
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{evento.descripcion}</p>
              )}

              {/* Aviso */}
              <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4"
                style={{ background: cc.light, border: `1px solid ${cc.border}` }}>
                <span style={{ color: cc.accent }} className="mt-0.5"><IcInfo /></span>
                <p className="text-[11px] leading-relaxed" style={{ color: cc.accent }}>
                  Para confirmar tu asistencia deberás leer y aceptar el compromiso de participación.
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 flex-shrink-0">
              <button onClick={() => setPaso(1)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition active:scale-95"
                style={{ background: `linear-gradient(135deg, ${cc.accent}cc, ${cc.accent})` }}>
                Ver compromiso y continuar →
              </button>
            </div>
          </>
        )}

        {/* ── Paso 1: Compromiso de asistencia ── */}
        {paso === 1 && (
          <>
            {/* Header fijo */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setPaso(0)}
                  className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition">
                  <IcBack />
                </button>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Compromiso de Asistencia</p>
                  <p className="text-[10px] text-slate-400">Instituto de Religión de Tacna · IRT</p>
                </div>
              </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {[
                {
                  titulo: "Mi compromiso",
                  texto: `Al confirmar mi asistencia al evento "${evento.titulo}", me comprometo a asistir puntualmente en la fecha y lugar indicados. Entiendo que mi confirmación ayuda a la organización del evento y al Instituto de Religión de Tacna (IRT) a preparar los recursos necesarios.`,
                },
                {
                  titulo: "Uso de datos",
                  texto: "Mi nombre y datos de perfil serán registrados como asistente confirmado. Esta información será visible únicamente para los organizadores del IRT y será utilizada exclusivamente para fines organizativos del evento.",
                },
                {
                  titulo: "Puntos y beneficios",
                  texto: evento.puntos > 0
                    ? `Al asistir al evento recibiré ${evento.puntos} punto${evento.puntos > 1 ? "s" : ""} en mi cuenta IRT Pass. Los puntos serán otorgados por el maestro o líder responsable del evento mediante el escáner QR.`
                    : "Este evento no otorga puntos adicionales. La asistencia queda registrada en tu historial del IRT Pass.",
                },
                {
                  titulo: "Cancelación",
                  texto: "Si no puedo asistir, entiendo que debo comunicarlo al responsable del evento. Puedo cancelar mi confirmación desde la sección de Eventos de la aplicación.",
                },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 mb-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{s.titulo}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.texto}</p>
                </div>
              ))}
              <div className="h-2" />
            </div>

            {/* Footer fijo */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
                <div
                  onClick={() => setAceptado(v => !v)}
                  className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                    aceptado ? "border-transparent" : "border-slate-300 bg-white"
                  }`}
                  style={aceptado ? { background: cc.accent, borderColor: cc.accent } : {}}>
                  {aceptado && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed"
                  onClick={() => setAceptado(v => !v)}>
                  He leído y acepto el compromiso de asistencia. Me comprometo a asistir al evento.
                </p>
              </label>

              <div className="flex gap-2.5">
                <button onClick={onCerrar}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button
                  onClick={() => aceptado && onConfirmar()}
                  disabled={!aceptado || confirmando}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${cc.accent}cc, ${cc.accent})` }}>
                  {confirmando ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                      </svg>
                      Confirmando...
                    </span>
                  ) : "Confirmar asistencia"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modal detalle evento ─────────────────────────────────────────────────────
function ModalEvento({ evento, confirmado, confirmando, onConfirmar, onCerrar }) {
  const cc     = getCatColor(evento.categoria);
  const hoy    = new Date().toISOString().split("T")[0];
  const pasado = evento.fecha && evento.fecha < hoy;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Imagen ancho completo */}
        {evento.imagen && (
          <div className="flex-shrink-0 w-full overflow-hidden sm:rounded-t-3xl rounded-t-3xl bg-white"
            style={{ maxHeight: 200 }}>
            <img src={evento.imagen} alt={evento.titulo}
              className="w-full h-full object-contain"
              style={{ maxHeight: 200 }}
              onError={e => { e.target.parentElement.style.display = "none"; }} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${cc.bg} ${cc.text}`}>
                {evento.categoria}
              </span>
              {evento.tipoPuntos && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <IcStar />
                  {evento.tipoPuntos.charAt(0).toUpperCase() + evento.tipoPuntos.slice(1).replace(/([A-Z])/g, " $1")}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base leading-snug">{evento.titulo}</h3>
          </div>
          <button onClick={onCerrar}
            className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition">
            <IcX />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { icon: <IcCal />,   label: "Fecha", val: formatFecha(evento.fecha) },
              { icon: <IcClock />, label: "Hora",  val: evento.hora || "Por confirmar" },
              evento.lugar && { icon: <IcPin />, label: "Lugar", val: evento.lugar },
            ].filter(Boolean).map(({ icon, label, val }) => (
              <div key={label} className={`bg-slate-50 rounded-xl px-3 py-2.5 ${label === "Lugar" ? "col-span-2" : ""}`}>
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  {icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-sm font-bold text-slate-700 break-words">{val}</p>
              </div>
            ))}
          </div>

          {/* Descripción */}
          {evento.descripcion && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Descripción</p>
              <p className="text-sm text-slate-600 leading-relaxed">{evento.descripcion}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
          {confirmado ? (
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <span className="text-green-500"><IcCheck /></span>
              <span className="text-sm font-bold text-green-700">Asistencia confirmada</span>
            </div>
          ) : pasado ? (
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-sm font-medium text-slate-400">Este evento ya finalizó</span>
            </div>
          ) : (
            <button
              onClick={() => { onConfirmar(evento); onCerrar(); }}
              disabled={confirmando}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white relative overflow-hidden group transition active:scale-95 disabled:opacity-70"
              style={{
                background: `linear-gradient(135deg, ${cc.accent}cc, ${cc.accent})`,
                boxShadow: `0 4px 16px ${cc.accent}35`,
              }}>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {confirmando ? (
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Confirmando...
                </span>
              ) : (
                <span className="relative">Confirmar asistencia</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Evento Card (estilo admin) ───────────────────────────────────────────────
function EventoCard({ evento, confirmado, onVerMas, compacto = false }) {
  const [imgOk, setImgOk] = useState(!!evento.imagen);
  const cc     = getCatColor(evento.categoria);
  const hoy    = new Date().toISOString().split("T")[0];
  const pasado = evento.fecha && evento.fecha < hoy;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Imagen grande ancho completo */}
      {evento.imagen && imgOk ? (
        <div className="relative w-full overflow-hidden" style={{ height: compacto ? 100 : 160 }}>
          <img
            src={evento.imagen} alt={evento.titulo}
            className="w-full h-full object-cover"
            style={{ filter: pasado ? "grayscale(0.35)" : "none" }}
            onError={() => setImgOk(false)}
          />
          {pasado && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <span className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Evento finalizado
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* Cuerpo */}
      <div className={compacto ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">

            {/* Badges */}
            <div className="mb-1.5 flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cc.bg} ${cc.text}`}>
                {evento.categoria}
              </span>
              {evento.tipoPuntos && (
                <span className="text-[10px] font-bold text-amber-600">
                  {evento.tipoPuntos.charAt(0).toUpperCase() +
                    evento.tipoPuntos.slice(1).replace(/([A-Z])/g, " $1")}
                </span>
              )}
            </div>

            {/* Título */}
            <p className={`font-bold text-slate-800 leading-snug break-words ${compacto ? "text-sm" : "text-base"}`}>
              {evento.titulo}
            </p>

            {/* Lugar (multilínea: no se corta el texto largo) */}
            {evento.lugar && (
              <p className="text-xs text-slate-500 mt-1 flex items-start gap-1 break-words">
                <IcPin /> <span className="min-w-0">{evento.lugar}</span>
              </p>
            )}

            {/* Fecha y hora */}
            <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1 break-words">
              <IcCal />
              {formatFecha(evento.fecha)}
              {evento.hora ? ` · ${evento.hora}` : ""}
            </p>
          </div>
        </div>

        {/* Botón */}
        <div className="mt-3">
          {confirmado ? (
            <button
              onClick={() => onVerMas(evento)}
              className={`w-full flex items-center py-2.5 rounded-2xl transition active:scale-95 ${compacto ? "justify-center px-2" : "justify-between px-4"}`}
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-green-500"><IcCheck /></span>
                <span className="text-sm font-bold text-green-700">{compacto ? "Confirmado" : "Asistencia confirmada"}</span>
              </div>
              {!compacto && <span className="text-xs text-green-600 font-medium">Ver detalle →</span>}
            </button>
          ) : pasado ? (
            <button
              onClick={() => onVerMas(evento)}
              className="w-full flex items-center justify-center py-2.5 rounded-2xl bg-slate-50 border border-slate-100 transition hover:bg-slate-100 active:scale-95"
            >
              <span className="text-xs font-medium text-slate-500">Ver detalle →</span>
            </button>
          ) : (
            <button
              onClick={() => onVerMas(evento)}
              className="w-full py-2.5 rounded-2xl text-sm font-bold text-white relative overflow-hidden group transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${cc.accent}cc, ${cc.accent})`,
                boxShadow: `0 4px 14px ${cc.accent}35`,
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">{compacto ? "Ver más" : "Más información"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Página principal ──────────────────────────────────────────────────────────
export default function Eventos() {
  const { user, profile } = useAuth();

  const [eventos, setEventos]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtro, setFiltro]             = useState("Todos");
  const [categorias, setCategorias]     = useState([]);
  const [asistencias, setAsistencias]   = useState({});
  const [eventoSel, setEventoSel]       = useState(null);
  const [confirmando, setConfirmando]   = useState(null);
  const [exito, setExito]               = useState(false);
  // Vista del catálogo ("lista" | "grilla"); se recuerda la preferencia del usuario
  const [vista, setVista] = useState(() => {
    try { return localStorage.getItem("eventosVista") === "grilla" ? "grilla" : "lista"; }
    catch { return "lista"; }
  });
  const cambiarVista = (v) => {
    setVista(v);
    try { localStorage.setItem("eventosVista", v); }
    catch { /* sin acceso a localStorage: la preferencia solo dura la sesión */ }
  };

  useEffect(() => {
    const uid = user?.uid;

    // Caché hit: datos ya cargados en esta sesión
    if (_eventosCache !== null && (!uid || _asistenciasCache[uid] !== undefined)) {
      setEventos(_eventosCache);
      const cats = [...new Set(_eventosCache.map(e => e.categoria).filter(Boolean))];
      setCategorias(cats);
      if (uid) setAsistencias(_asistenciasCache[uid]);
      setLoading(false);
      return;
    }

    const cargar = async () => {
      try {
        // Solo leer Firestore si no está en caché
        if (_eventosCache === null) {
          const snap = await getDocs(
            query(collection(db, "eventos"), orderBy("createdAt", "desc"))
          );
          _eventosCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        setEventos(_eventosCache);
        const cats = [...new Set(_eventosCache.map(e => e.categoria).filter(Boolean))];
        setCategorias(cats);

        if (uid && _asistenciasCache[uid] === undefined) {
          const checks = await Promise.all(
            _eventosCache.map(e =>
              getDoc(doc(db, "asistencias", `${uid}_${e.id}`))
                .then(snap => [e.id, snap.exists()])
            )
          );
          _asistenciasCache[uid] = Object.fromEntries(checks);
        }
        if (uid) setAsistencias(_asistenciasCache[uid] ?? {});
      } catch (err) {
        console.error("[Eventos] Error cargando:", err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.uid]); // uid como dependencia, no el objeto User completo

  const confirmarAsistencia = async (evento) => {
    if (!evento || !user) return;
    setConfirmando(evento.id);
    try {
      const docId = `${user.uid}_${evento.id}`;
      await setDoc(doc(db, "asistencias", docId), {
        uid:          user.uid,
        nombre:       profile?.name ? `${profile.name} ${profile.lastName ?? ""}`.trim() : (user.displayName ?? user.email),
        email:        user.email ?? "",
        eventoId:     evento.id,
        eventoTitulo: evento.titulo,
        tipoPuntos:   evento.tipoPuntos ?? "",
        estado:       "confirmado",
        fecha:        serverTimestamp(),
      });
      // Actualizar estado y sincronizar con caché
      setAsistencias(p => {
        const next = { ...p, [evento.id]: true };
        if (user?.uid) _asistenciasCache[user.uid] = next;
        return next;
      });
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      console.error("[Eventos] Error confirmando:", err);
      mostrarToast(mensajeDeError(err, "No se pudo confirmar tu asistencia. Intenta de nuevo."));
    } finally {
      setConfirmando(null);
    }
  };

  const eventosFiltrados = eventos.filter(e =>
    filtro === "Todos" || e.categoria === filtro
  );

  const hoy      = new Date().toISOString().split("T")[0];
  const proximos = eventosFiltrados.filter(e => !e.fecha || e.fecha >= hoy);
  const pasados  = eventosFiltrados.filter(e => e.fecha && e.fecha < hoy);

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-100 border-t-violet-500" />
    </div>
  );

  return (
    <div className="flex flex-col pb-8">

      {/* Header */}
      <div className="px-4 pt-5 pb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Eventos</h2>
          <p className="text-xs text-white/60 mt-0.5">Confirma tu asistencia a los eventos.</p>
        </div>

        {/* Alternar vista lista / grilla */}
        <div className="flex flex-shrink-0 rounded-xl bg-white/10 p-0.5" role="group" aria-label="Vista de eventos">
          {[
            { key: "lista",  label: "Vista de lista",  d: "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" },
            { key: "grilla", label: "Vista de galería", d: "M3.75 3.75h6.5v6.5h-6.5zM13.75 3.75h6.5v6.5h-6.5zM3.75 13.75h6.5v6.5h-6.5zM13.75 13.75h6.5v6.5h-6.5z" },
          ].map(({ key, label, d }) => (
            <button
              key={key}
              onClick={() => cambiarVista(key)}
              aria-label={label}
              aria-pressed={vista === key}
              className={`flex h-8 w-9 items-center justify-center rounded-lg transition ${
                vista === key ? "bg-white text-slate-700 shadow-sm" : "text-white/60 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Filtro categorías */}
      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {["Todos", ...categorias].map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${
                filtro === cat
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
              style={filtro === cat ? {
                background: cat === "Todos" ? "#7C3AED" : getCatColor(cat).accent,
              } : {}}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Sin eventos */}
      {eventosFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-3">
          <IcCal />
          <p className="text-sm text-slate-400">No hay eventos disponibles</p>
        </div>
      )}

      <div className="flex flex-col gap-6 px-4">

        {/* Próximos */}
        {proximos.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Próximos eventos
            </p>
            <div className={vista === "grilla" ? "grid grid-cols-2 gap-3 items-start" : "flex flex-col gap-3"}>
              {proximos.map(ev => (
                <EventoCard
                  key={ev.id}
                  evento={ev}
                  confirmado={!!asistencias[ev.id]}
                  onVerMas={setEventoSel}
                  compacto={vista === "grilla"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pasados */}
        {pasados.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Eventos pasados
            </p>
            <div className={vista === "grilla" ? "grid grid-cols-2 gap-3 items-start" : "flex flex-col gap-3"}>
              {pasados.map(ev => (
                <EventoCard
                  key={ev.id}
                  evento={ev}
                  confirmado={!!asistencias[ev.id]}
                  onVerMas={setEventoSel}
                  compacto={vista === "grilla"}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle evento */}
      {eventoSel && (
        <ModalEvento
          evento={eventoSel}
          confirmado={!!asistencias[eventoSel.id]}
          confirmando={confirmando === eventoSel.id}
          onConfirmar={confirmarAsistencia}
          onCerrar={() => setEventoSel(null)}
        />
      )}

      {/* Toast éxito */}
      {exito && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold shadow-xl animate-slide-up">
          <IcCheck />
          ¡Asistencia confirmada!
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up {
          from { opacity: 0; transform: translate(-50%, 14px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-up { animation: slide-up .3s ease both; }
      `}</style>
    </div>
  );
}
