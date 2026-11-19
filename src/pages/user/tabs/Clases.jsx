import { useEffect, useState } from "react";
import { getClases } from "../../../services/adminService";
import { useAuth } from "../../../context/AuthContext";
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import { mostrarToast, mensajeDeError } from "../../../services/toast";
import { optimizarImagen } from "../../../utils/imagenes";

// Caché de módulo: persiste mientras la SPA no recarga
let _clasesCache = null;
const _inscripcionesCache = {}; // { [uid]: { [claseId]: bool } }

// ── Política LDS ──────────────────────────────────────────────────────────────
const SECCIONES_POLITICA = [
  {
    titulo: "Participación en Instituto",
    texto: "Participar en Instituto es un privilegio y te damos la bienvenida. Te comprometes a cumplir las normas de Instituto y también aceptas que Seminarios e Institutos de Religión, un departamento de La Iglesia de Jesucristo de los Santos de los Últimos Días, no seremos responsables de ningún perjuicio que pudiera surgir de tu incumplimiento de estas normas.",
  },
  {
    titulo: "Normas de Privacidad",
    texto: "Aceptas que podremos recopilar y procesar tu información personal de este formulario, de tu cédula de miembro y del contenido obtenido durante tus actividades en Instituto, de conformidad con el Aviso de privacidad de la Iglesia (PrivacyNotice.ChurchofJesusChrist.org). Tus datos serán utilizados exclusivamente para fines organizativos y académicos de UP JAS AQP.",
  },
  {
    titulo: "Encuestas",
    texto: "En caso de que se te pida participar en una encuesta, entiendes que la participación es completamente voluntaria y que podrás retirarte en cualquier momento.",
  },
  {
    titulo: "Uso de Recursos en Línea",
    texto: "Las Herramientas de Instituto solo podrán usarse para comunicarse en temas del Evangelio. No puedes descargar ni publicar archivos desde las Herramientas en plataformas externas (ej. YouTube, Facebook). No garantizamos seguridad total en comunicaciones electrónicas.",
  },
  {
    titulo: "Disposiciones Varias",
    texto: "Eres responsable de cumplir con las leyes de tu región. Este Acuerdo se rige por las leyes del estado de Utah, EE. UU. Para preguntas, comunícate con siregistration@ChurchofJesusChrist.org.",
  },
];

const DIAS_ORDER = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const MODALIDAD_STYLE = {
  Presencial: { bg: "bg-blue-100",   text: "text-blue-700"   },
  Virtual:    { bg: "bg-violet-100", text: "text-violet-700" },
  Híbrida:    { bg: "bg-amber-100",  text: "text-amber-700"  },
};

// ── Íconos ────────────────────────────────────────────────────────────────────
const IcUser  = () => <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/></svg>;
const IcClock = () => <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IcCheck = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>;
const IcInfo  = () => <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>;
const IcCal   = () => <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5"/></svg>;

// ── Placeholder imagen ────────────────────────────────────────────────────────
function ImgPlaceholder({ modalidad }) {
  const colors = { Presencial:"#DBEAFE", Virtual:"#EDE9FE", Híbrida:"#FEF3C7" };
  const icons  = { Presencial:"#3B82F6", Virtual:"#7C3AED", Híbrida:"#D97706" };
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: colors[modalidad] || "#F1F5F9" }}>
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={icons[modalidad] || "#94A3B8"} strokeWidth={1.3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
      </svg>
    </div>
  );
}

// ── Clase Card ────────────────────────────────────────────────────────────────
// Colores base por modalidad para el efecto glass
const GLASS_COLORS = {
  Presencial: { orb1: "#3B82F6", orb2: "#60A5FA", badge: "rgba(59,130,246,0.15)", badgeText: "#1D4ED8", border: "rgba(59,130,246,0.2)"  },
  Virtual:    { orb1: "#7C3AED", orb2: "#A78BFA", badge: "rgba(124,58,237,0.15)", badgeText: "#5B21B6", border: "rgba(124,58,237,0.2)"  },
  Híbrida:    { orb1: "#D97706", orb2: "#FCD34D", badge: "rgba(217,119,6,0.15)",  badgeText: "#92400E", border: "rgba(217,119,6,0.2)"   },
};

function ClaseCard({ clase, inscrito, onInscribir }) {
  const [imgOk, setImgOk]     = useState(!!clase.imagen);
  const [pressed, setPressed] = useState(false);
  const gc = GLASS_COLORS[clase.modalidad] || GLASS_COLORS.Presencial;

  return (
    <div
      className="clase-card relative overflow-hidden rounded-[22px] transition-all duration-300"
      style={{
        background: "#ffffff",
        border: `1px solid ${gc.border}`,
        boxShadow: `0 2px 12px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,1) inset`,
        transform: pressed ? "scale(0.985)" : "scale(1)",
      }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
    >
      {/* Orb decorativo de fondo */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${gc.orb1}22 0%, transparent 70%)` }} />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${gc.orb2}18 0%, transparent 70%)` }} />

      {/* Borde luminoso superior */}
      <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${gc.orb1}60, transparent)` }} />

      <div className="flex relative" style={{gap:0}}>

        {/* Imagen cuadrada 100×100 */}
        <div className="flex-shrink-0 w-[100px] h-[100px] overflow-hidden" style={{borderRadius:"20px 0 0 20px",margin:0}}>
          {clase.imagen && imgOk ? (
            <img
              src={optimizarImagen(clase.imagen, 800)} alt={clase.titulo}
              loading="lazy" decoding="async"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.97) saturate(1.1)" }}
              onError={() => setImgOk(false)}
            />
          ) : (
            <ImgPlaceholder modalidad={clase.modalidad} />
          )}
        </div>

        {/* Separador glass vertical */}
        <div className="w-px self-stretch flex-shrink-0"
          style={{ background: `linear-gradient(180deg, transparent, ${gc.border}, transparent)` }} />

        {/* Info */}
        <div className="flex-1 min-w-0 px-3 pt-3 pb-2 flex flex-col justify-between">

          {/* Badge modalidad */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{ background: gc.badge, color: gc.badgeText, border: `1px solid ${gc.border}` }}>
              {clase.modalidad}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: gc.orb1 }}>
              Instituto
            </span>
          </div>

          {/* Título */}
          <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-2" style={{color:"#1e293b"}}>
            {clase.titulo}
          </p>

          {/* Meta */}
          <div className="mt-1.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[11px]" style={{color:"#64748b"}}>
              <IcUser /><span className="truncate">{clase.maestroNombre}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" style={{color:"#64748b"}}>
              <IcClock /><span>{clase.dia} · {clase.hora}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Separador horizontal glass */}
      <div className="mx-3 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gc.border}, transparent)` }} />

      {/* Botón */}
      <div className="px-3 pb-3 pt-2.5">
        {inscrito ? (
          <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <span className="text-green-500"><IcCheck /></span>
            <span className="text-xs font-bold text-green-700">Inscrito</span>
          </div>
        ) : (
          <button
            onClick={() => onInscribir(clase)}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white tracking-wide relative overflow-hidden group"
            style={{
              background: `linear-gradient(135deg, ${gc.orb1}, ${gc.orb1}dd)`,
              boxShadow: `0 4px 16px ${gc.orb1}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
          >
            {/* Shine sweep */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">INSCRIBIRME</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Modal política ────────────────────────────────────────────────────────────
function ModalPolitica({ clase, onConfirmar, onCerrar, inscribiendo }) {
  const [aceptado, setAceptado] = useState(false);
  const [paso, setPaso]         = useState(0); // 0=detalle clase, 1=politica

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}>

        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* ── Paso 0: Detalle de la clase ── */}
        {paso === 0 && (
          <>
            <div className="px-5 pt-4 pb-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Inscripción</p>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{clase.titulo}</h3>
                </div>
                <button onClick={onCerrar}
                  className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Imagen */}
            {clase.imagen && (
              <div className="mx-5 mb-3 rounded-2xl overflow-hidden h-36 flex-shrink-0">
                <img src={optimizarImagen(clase.imagen, 800)} alt={clase.titulo} decoding="async" className="w-full h-full object-cover"
                  onError={(e) => { e.target.parentElement.style.display="none"; }} />
              </div>
            )}

            {/* Info de la clase */}
            <div className="px-5 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: <IcCal />,   label: "Día",       val: clase.dia },
                  { icon: <IcClock />, label: "Hora",      val: clase.hora },
                  { icon: <IcUser />,  label: "Maestro",   val: clase.maestroNombre },
                  { icon: <IcClock />, label: "Modalidad", val: clase.modalidad },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5">{icon}<span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div>
                    <p className="text-sm font-bold text-slate-700 truncate">{val}</p>
                  </div>
                ))}
              </div>

              {clase.descripcion && (
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{clase.descripcion}</p>
              )}
            </div>

            {/* Aviso política */}
            <div className="mx-5 mb-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex-shrink-0">
              <span className="text-blue-500 mt-0.5"><IcInfo /></span>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Para completar tu inscripción deberás leer y aceptar el Acuerdo de Instituto de la Iglesia SUD.
              </p>
            </div>

            <div className="px-5 pb-5 flex-shrink-0">
              <button onClick={() => setPaso(1)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition active:scale-95"
                style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)" }}>
                Ver acuerdo y continuar →
              </button>
            </div>
          </>
        )}

        {/* ── Paso 1: Política LDS ── */}
        {paso === 1 && (
          <>
            {/* Header fijo */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setPaso(0)}
                  className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                  </svg>
                </button>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Acuerdo de Inscripción</p>
                  <p className="text-[10px] text-slate-400">Seminarios e Institutos de Religión · LDS</p>
                </div>
              </div>
            </div>

            {/* Texto política — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">

              {/* Logo LDS */}
              <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-slate-100">
                <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">La Iglesia de Jesucristo</p>
                  <p className="text-[10px] text-slate-400">de los Santos de los Últimos Días</p>
                </div>
              </div>

              {/* Secciones */}
              <div className="flex flex-col gap-4">
                {SECCIONES_POLITICA.map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      {s.titulo}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.texto}</p>
                  </div>
                ))}
              </div>

              <div className="h-4" />
            </div>

            {/* Footer fijo */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
                <div
                  onClick={() => setAceptado(v => !v)}
                  className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                    aceptado ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                  }`}>
                  {aceptado && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed" onClick={() => setAceptado(v => !v)}>
                  He leído y acepto el Acuerdo de Inscripción. Entiendo las normas de participación y privacidad.
                </p>
              </label>

              {/* Botones */}
              <div className="flex gap-2.5">
                <button onClick={onCerrar}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button
                  onClick={() => { if (aceptado && !inscribiendo) onConfirmar(); }}
                  disabled={!aceptado || inscribiendo}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)" }}>
                  {inscribiendo ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                      </svg>
                      Inscribiendo...
                    </span>
                  ) : "Confirmar"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Clases() {
  const { user: currentUser, profile } = useAuth();

  const [clases, setClases]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtro, setFiltro]             = useState("Todos");
  const [claseSeleccionada, setClase]   = useState(null);
  const [inscripciones, setInscripciones] = useState({});
  const [inscribiendo, setInscribiendo] = useState(false);
  const [exito, setExito]               = useState(false);

  useEffect(() => {
    const uid = currentUser?.uid;

    // Caché hit: datos ya cargados en esta sesión
    if (_clasesCache !== null && (!uid || _inscripcionesCache[uid] !== undefined)) {
      setClases(_clasesCache);
      if (uid) setInscripciones(_inscripcionesCache[uid]);
      setLoading(false);
      return;
    }

    const cargar = async () => {
      // Solo leer Firestore si no está en caché
      if (_clasesCache === null) {
        _clasesCache = await getClases();
      }
      setClases(_clasesCache);

      if (uid && _inscripcionesCache[uid] === undefined) {
        // Una sola consulta con las inscripciones de la persona (antes: una lectura por cada clase)
        const snap = await getDocs(
          query(collection(db, "inscripciones"), where("uid", "==", uid))
        );
        const mapa = Object.fromEntries(_clasesCache.map((c) => [c.id, false]));
        snap.docs.forEach((d) => {
          const claseId = d.data().claseId;
          if (claseId) mapa[claseId] = true;
        });
        _inscripcionesCache[uid] = mapa;
      }
      if (uid) setInscripciones(_inscripcionesCache[uid] ?? {});
      setLoading(false);
    };
    cargar();
  }, [currentUser?.uid]); // uid como dependencia, no el objeto User completo

  // Agrupar por día
  const clasesPorDia = DIAS_ORDER.reduce((acc, dia) => {
    const del_dia = clases.filter((c) =>
      (filtro === "Todos" || c.dia === filtro) && c.dia === dia
    );
    if (del_dia.length) acc[dia] = del_dia;
    return acc;
  }, {});

  const confirmarInscripcion = async () => {
    // Guards
    if (!claseSeleccionada) { console.error("[Clases] Sin clase seleccionada"); return; }
    if (!currentUser)        { console.error("[Clases] Sin usuario autenticado"); return; }

    setInscribiendo(true);
    try {
      const docId = `${currentUser.uid}_${claseSeleccionada.id}`;
      const nombre = profile?.name
        ? `${profile.name} ${profile.lastName ?? ""}`.trim()
        : (currentUser.displayName ?? currentUser.email ?? "Usuario");

      const data = {
        uid:              currentUser.uid,
        nombre,
        claseId:          claseSeleccionada.id,
        claseTitulo:      claseSeleccionada.titulo,
        maestroNombre:    claseSeleccionada.maestroNombre ?? "",
        dia:              claseSeleccionada.dia,
        hora:             claseSeleccionada.hora,
        modalidad:        claseSeleccionada.modalidad,
        aceptoPolitica:   true,
        fechaInscripcion: serverTimestamp(),
      };

      await setDoc(doc(db, "inscripciones", docId), data);

      // Actualizar estado y sincronizar con caché
      setInscripciones((p) => {
        const next = { ...p, [claseSeleccionada.id]: true };
        if (currentUser?.uid) _inscripcionesCache[currentUser.uid] = next;
        return next;
      });
      setClase(null);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      console.error("[Clases] Error al inscribirse:", err);
      // Mensaje comprensible según el tipo de error (permisos, conexión, etc.)
      mostrarToast(mensajeDeError(err, "No se pudo completar tu inscripción. Intenta de nuevo."));
    } finally {
      setInscribiendo(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-100 border-t-slate-400" />
    </div>
  );

  return (
    <div className="flex flex-col pb-8">

      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <h2 className="text-lg font-bold text-white">Clases y Talleres</h2>
        <p className="text-xs text-white/60 mt-0.5">Filtra por día de la semana.</p>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {["Todos", ...DIAS_ORDER].map((d) => {
          const tiene = d === "Todos" || clases.some((c) => c.dia === d);
          if (!tiene) return null;
          return (
            <button
              key={d}
              onClick={() => setFiltro(d)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${
                filtro === d
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white/10 text-white/80 border-white/20 hover:border-white/40"
              }`}
            >
              {d}
              {d !== "Todos" && clases.filter((c) => c.dia === d).length > 0 && (
                <span className={`h-1.5 w-1.5 rounded-full ${filtro === d ? "bg-blue-300" : "bg-green-400"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Sin resultados */}
      {Object.keys(clasesPorDia).length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <svg className="h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
          </svg>
          <p className="text-sm">No hay clases disponibles</p>
        </div>
      )}

      {/* Clases agrupadas por día */}
      <div className="flex flex-col gap-1 px-4">
        {Object.entries(clasesPorDia).map(([dia, lista]) => (
          <div key={dia}>
            {/* Header día */}
            <div className="flex items-center gap-2 py-3 text-white/50">
              <IcCal />
              <span className="text-[11px] font-bold uppercase tracking-widest">{dia}</span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2.5">
              {lista.map((c) => (
                <ClaseCard
                  key={c.id}
                  clase={c}
                  inscrito={!!inscripciones[c.id]}
                  onInscribir={setClase}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal política */}
      {claseSeleccionada && (
        <ModalPolitica
          clase={claseSeleccionada}
          onCerrar={() => setClase(null)}
          onConfirmar={confirmarInscripcion}
          inscribiendo={inscribiendo}
        />
      )}

      {/* Toast éxito */}
      {exito && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold shadow-xl animate-slide-up">
          <IcCheck />
          ¡Inscripción confirmada!
        </div>
      )}

      <style>{`
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .scrollbar-hide::-webkit-scrollbar{display:none;}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none;}
        @keyframes slide-up{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}
        .animate-slide-up{animation:slide-up .3s ease both;}
        .clase-card{transition:transform .15s ease,box-shadow .15s ease;}
        .clase-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.10),0 1px 0 rgba(255,255,255,0.9) inset !important;}
        @keyframes card-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .clase-card{animation:card-in .35s cubic-bezier(.22,1,.36,1) both;}
        .clase-card:nth-child(1){animation-delay:.04s}
        .clase-card:nth-child(2){animation-delay:.08s}
        .clase-card:nth-child(3){animation-delay:.12s}
        .clase-card:nth-child(4){animation-delay:.16s}
        .clase-card:nth-child(5){animation-delay:.20s}
      `}</style>
    </div>
  );
}
