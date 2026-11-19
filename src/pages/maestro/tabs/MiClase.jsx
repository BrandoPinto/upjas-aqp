import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/firebaseConfig";
import {
  collection, query, where, getDocs, doc, getDoc
} from "firebase/firestore";
import { otorgarPuntos, getConfigPuntos } from "../../../services/puntosService";

// Caché de módulo: persiste mientras la SPA no recarga
const _miClaseCache = {};          // { [uid]: { clases, alumnos, config } }
const _perfilesCache = new Map();  // { uid → perfilData }

// ── Íconos ────────────────────────────────────────────────────────────────────
const IcUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const IcBook = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);
const IcClock = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IcChevron = ({ open }) => (
  <svg className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const IcUser = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const IcPhone = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-1.243 1.008-2.25 2.25-2.25h2.036c.527 0 .98.382 1.074.9l.537 2.985a1.124 1.124 0 01-.27 1.003l-.82.82a15.979 15.979 0 006.75 6.75l.82-.82a1.124 1.124 0 011.003-.27l2.985.537c.518.094.9.547.9 1.074V17.75a2.25 2.25 0 01-2.25 2.25h-2.25C8.552 20 2 13.448 2 5.75v-2.25a2.25 2.25 0 012.25-2.25z" />
  </svg>
);
const IcMap = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const IcCalendar = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
  </svg>
);
const IcX = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IcStar = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

// Calcula edad desde fecha string "YYYY-MM-DD"
function calcularEdad(birthDate) {
  if (!birthDate) return null;
  const hoy = new Date();
  const nac = new Date(birthDate);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

const MODALIDAD_COLOR = {
  Presencial: { bg: "bg-blue-100",   text: "text-blue-700"   },
  Virtual:    { bg: "bg-violet-100", text: "text-violet-700" },
  Híbrida:    { bg: "bg-amber-100",  text: "text-amber-700"  },
};

// Tipos de puntos que puede dar un maestro
const TIPOS_MAESTRO = [
  { key: "asistencia", label: "Asistencia Instituto", emoji: "📚" },
  { key: "invitacion", label: "Invitación a amigo",   emoji: "🤝" },
];

// ── Avatar con iniciales ──────────────────────────────────────────────────────
function Avatar({ nombre, size = "md" }) {
  const partes = (nombre || "").trim().split(" ");
  const iniciales = partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`
    : (partes[0]?.[0] ?? "?");

  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  const color = colors[(nombre?.charCodeAt(0) ?? 0) % colors.length];
  const sz = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const rad = size === "lg" ? "rounded-2xl" : "rounded-xl";

  return (
    <div className={`flex-shrink-0 flex items-center justify-center font-bold ${sz} ${rad} ${color}`}>
      {iniciales.toUpperCase()}
    </div>
  );
}

// ── Modal dar puntos ──────────────────────────────────────────────────────────
function ModalDarPuntos({ alumno, config, uidMaestro, onCerrar }) {
  const [dando, setDando]         = useState(null);
  const [resultados, setResultados] = useState({});

  const dar = async (tipo) => {
    if (dando || resultados[tipo]?.ok) return;
    setDando(tipo);
    try {
      const valor = await otorgarPuntos({
        uidReceptor:  alumno.uid,
        uidOtorgante: uidMaestro,
        rolOtorgante: "maestro",
        tipo,
      });
      setResultados((prev) => ({ ...prev, [tipo]: { ok: true, msg: `+${valor} pts otorgados ✓` } }));
    } catch (err) {
      setResultados((prev) => ({ ...prev, [tipo]: { ok: false, msg: err.message } }));
    } finally {
      setDando(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 sm:pb-0"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle móvil */}
        <div className="flex justify-center mb-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Info alumno */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar nombre={alumno.nombre} size="md" />
          <div>
            <p className="font-bold text-slate-800">{alumno.nombre}</p>
            {alumno.codigoJAS && (
              <p className="text-xs text-slate-400 font-medium">{alumno.codigoJAS}</p>
            )}
          </div>
        </div>

        <div className="h-px bg-slate-100 mb-4" />
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Otorgar puntos</p>

        <div className="flex flex-col gap-2">
          {TIPOS_MAESTRO.map((t) => {
            const res = resultados[t.key];
            const yaOtorgado = res?.ok;
            const cargando   = dando === t.key;

            return (
              <button
                key={t.key}
                onClick={() => dar(t.key)}
                disabled={!!dando || yaOtorgado}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition active:scale-[0.98] ${
                  yaOtorgado
                    ? "border-emerald-200 bg-emerald-50 opacity-80 cursor-default"
                    : "border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300"
                } disabled:opacity-60`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="text-base">{t.emoji}</span>
                  {t.label}
                </span>
                <span className={`text-xs font-bold ${yaOtorgado ? "text-emerald-600" : "text-emerald-700"}`}>
                  {cargando
                    ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                    : yaOtorgado
                      ? res.msg
                      : `+${config?.[t.key] ?? "?"} pts`
                  }
                </span>
              </button>
            );
          })}
        </div>

        {/* Errores por tipo */}
        {Object.entries(resultados)
          .filter(([, v]) => !v.ok)
          .map(([tipo, res]) => (
            <p key={tipo} className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">
              {res.msg}
            </p>
          ))}

        <button
          onClick={onCerrar}
          className="mt-4 w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ── Modal detalle alumno ──────────────────────────────────────────────────────
function ModalAlumno({ alumno, onCerrar }) {
  const edad = calcularEdad(alumno.birthDate);

  const filas = [
    { icon: <IcUser />,     label: "Nombre",   val: `${alumno.name ?? ""} ${alumno.lastName ?? ""}`.trim() },
    { icon: <IcCalendar />, label: "Edad",      val: edad ? `${edad} años` : null },
    { icon: <IcPhone />,    label: "Celular",   val: alumno.phone ?? null },
    { icon: <IcMap />,      label: "Estaca",    val: alumno.stateValue ?? null },
    { icon: <IcMap />,      label: "Barrio",    val: alumno.parish ?? null },
  ].filter(f => f.val);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-sm bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Perfil del alumno</p>
          <button onClick={onCerrar}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition">
            <IcX />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 pb-5 pt-2">
          <Avatar nombre={`${alumno.name ?? ""} ${alumno.lastName ?? ""}`} size="lg" />
          <div className="text-center mt-1">
            <p className="font-bold text-slate-800 text-lg">
              {alumno.name} {alumno.lastName}
            </p>
            {alumno.codigoJAS && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">{alumno.codigoJAS}</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 mx-5 mb-5">
          {filas.map(({ icon, label, val }) => (
            <div key={label} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
              <div className="text-slate-400 flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{val}</p>
              </div>
              {label === "Celular" && val && (
                <a
                  href={`https://wa.me/51${val.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition active:scale-95"
                  style={{ background: "#25D366" }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.882l6.198-1.448A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.388l-.361-.214-3.68.859.905-3.585-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onCerrar}
            className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card de alumno ────────────────────────────────────────────────────────────
function AlumnoCard({ alumno, onDarPunto }) {
  const [modalAbierto, setModal]    = useState(false);
  const [perfil, setPerfil]         = useState(null);
  const [loadingPerfil, setLoading] = useState(false);

  const abrirPerfil = async () => {
    setModal(true);
    if (!alumno.uid) return;

    // Verificar caché de módulo primero (persiste entre remounts)
    if (_perfilesCache.has(alumno.uid)) {
      setPerfil(_perfilesCache.get(alumno.uid));
      return;
    }
    // Verificar caché local del componente
    if (perfil) return;

    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", alumno.uid));
      const data = snap.exists() ? { ...alumno, ...snap.data() } : alumno;
      _perfilesCache.set(alumno.uid, data);
      setPerfil(data);
    } catch { setPerfil(alumno); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center gap-2 py-2 px-3 rounded-2xl hover:bg-slate-50 transition-colors">

        {/* Área de perfil */}
        <button onClick={abrirPerfil} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <Avatar nombre={alumno.nombre} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{alumno.nombre}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {alumno.codigoJAS && (
                <span className="text-[10px] text-slate-400 font-medium">{alumno.codigoJAS}</span>
              )}
              {alumno.modalidad && (
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${MODALIDAD_COLOR[alumno.modalidad]?.bg ?? "bg-slate-100"} ${MODALIDAD_COLOR[alumno.modalidad]?.text ?? "text-slate-600"}`}>
                  {alumno.modalidad}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Botón dar puntos */}
        <button
          onClick={() => onDarPunto(alumno)}
          className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95 transition"
          title="Dar puntos"
        >
          <IcStar />
        </button>

        {/* Ver perfil */}
        <button
          onClick={abrirPerfil}
          className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {modalAbierto && (
        loadingPerfil ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          </div>
        ) : (
          <ModalAlumno
            alumno={perfil ?? alumno}
            onCerrar={() => setModal(false)}
          />
        )
      )}
    </>
  );
}

// ── Card de clase con alumnos expandibles ─────────────────────────────────────
function ClaseCard({ clase, alumnos, loadingAlumnos, onDarPunto }) {
  const [abierto, setAbierto] = useState(false);
  const mod = MODALIDAD_COLOR[clase.modalidad] || { bg: "bg-slate-100", text: "text-slate-600" };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-100">
          {clase.imagen ? (
            <img src={clase.imagen} alt={clase.titulo}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <IcBook />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${mod.bg} ${mod.text}`}>
              {clase.modalidad}
            </span>
          </div>
          <p className="font-bold text-slate-800 text-sm leading-snug truncate">{clase.titulo}</p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            <IcClock />
            <span>{clase.dia} · {clase.hora}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2.5 py-1">
            <IcUsers />
            <span className="text-xs font-bold text-slate-600">{alumnos.length}</span>
          </div>
          <IcChevron open={abierto} />
        </div>
      </button>

      {abierto && (
        <div className="border-t border-slate-100">
          {loadingAlumnos ? (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
            </div>
          ) : alumnos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-300">
              <IcUsers />
              <p className="text-xs">Sin alumnos inscritos aún</p>
            </div>
          ) : (
            <div className="px-1 py-2 flex flex-col divide-y divide-slate-50">
              {alumnos.map((a) => (
                <AlumnoCard key={a.uid} alumno={a} onDarPunto={onDarPunto} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MiClase() {
  const { user } = useAuth();
  const [clases, setClases]                     = useState([]);
  const [alumnosPorClase, setAlumnos]           = useState({});
  const [loading, setLoading]                   = useState(true);
  const [loadingAlumnos, setLoadingAlumnos]     = useState(false);
  const [config, setConfig]                     = useState(null);
  const [alumnoParaPuntos, setAlumnoParaPuntos] = useState(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    // Caché hit: datos ya cargados para este maestro en esta sesión
    if (_miClaseCache[uid]) {
      setClases(_miClaseCache[uid].clases);
      setAlumnos(_miClaseCache[uid].alumnos);
      setConfig(_miClaseCache[uid].config);
      setLoading(false);
      return;
    }

    const cargar = async () => {
      setLoading(true);
      try {
        const cfg = await getConfigPuntos(); // ya tiene caché en puntosService
        setConfig(cfg);

        const qClases = query(
          collection(db, "clases"),
          where("maestroUid", "==", uid)
        );
        const snapClases = await getDocs(qClases);
        const misClases  = snapClases.docs.map(d => ({ id: d.id, ...d.data() }));
        setClases(misClases);

        if (misClases.length === 0) {
          _miClaseCache[uid] = { clases: misClases, alumnos: {}, config: cfg };
          setLoading(false);
          return;
        }

        setLoadingAlumnos(true);
        const claseIds = misClases.map(c => c.id);

        const CHUNK = 30;
        const chunks = [];
        for (let i = 0; i < claseIds.length; i += CHUNK) {
          chunks.push(claseIds.slice(i, i + CHUNK));
        }

        const todasInscripciones = [];
        for (const chunk of chunks) {
          const qIns = query(
            collection(db, "inscripciones"),
            where("claseId", "in", chunk)
          );
          const snapIns = await getDocs(qIns);
          snapIns.docs.forEach(d => todasInscripciones.push(d.data()));
        }

        const agrupado = {};
        misClases.forEach(c => { agrupado[c.id] = []; });
        todasInscripciones.forEach(ins => {
          if (agrupado[ins.claseId]) {
            agrupado[ins.claseId].push({
              nombre:    ins.nombre    ?? "Sin nombre",
              codigoJAS: ins.codigoJAS ?? "",
              modalidad: ins.modalidad ?? "",
              puntos:    ins.puntos,
              uid:       ins.uid,
            });
          }
        });

        setAlumnos(agrupado);
        _miClaseCache[uid] = { clases: misClases, alumnos: agrupado, config: cfg };
      } catch (err) {
        console.error("[MiClase] Error:", err);
      } finally {
        setLoading(false);
        setLoadingAlumnos(false);
      }
    };

    cargar();
  }, [user?.uid]); // uid como dependencia, no el objeto User completo

  const totalAlumnos = Object.values(alumnosPorClase)
    .flat()
    .filter((a, i, arr) => arr.findIndex(b => b.uid === a.uid) === i)
    .length;

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500" />
    </div>
  );

  return (
    <div className="flex flex-col pb-8">

      <div className="px-4 pt-5 pb-4">
        <h2 className="text-lg font-bold text-slate-800">Mis Clases</h2>
        <p className="text-xs text-slate-400 mt-0.5">Toca una clase para ver los alumnos inscritos</p>
      </div>

      {clases.length > 0 && (
        <div className="flex gap-3 px-4 mb-4">
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{clases.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {clases.length === 1 ? "Clase" : "Clases"}
            </p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalAlumnos}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {totalAlumnos === 1 ? "Alumno" : "Alumnos"}
            </p>
          </div>
        </div>
      )}

      {clases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
          <IcBook />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">Sin clases asignadas</p>
            <p className="text-xs text-slate-300 mt-1">El administrador debe asignarte como maestro</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 px-4">
        {clases.map(c => (
          <ClaseCard
            key={c.id}
            clase={c}
            alumnos={alumnosPorClase[c.id] ?? []}
            loadingAlumnos={loadingAlumnos}
            onDarPunto={setAlumnoParaPuntos}
          />
        ))}
      </div>

      {/* Modal dar puntos */}
      {alumnoParaPuntos && (
        <ModalDarPuntos
          alumno={alumnoParaPuntos}
          config={config}
          uidMaestro={user.uid}
          onCerrar={() => setAlumnoParaPuntos(null)}
        />
      )}
    </div>
  );
}
