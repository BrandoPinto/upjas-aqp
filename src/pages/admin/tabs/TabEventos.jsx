import { useEffect, useRef, useState } from "react";
import {
  getEventos, crearEvento, actualizarEvento, eliminarEvento,
  getCategorias, crearCategoria, eliminarCategoria,
} from "../../../services/adminService";
import { subirImagen } from "../../../services/cloudinaryService";
import { mostrarToast } from "../../../services/toast";
import { optimizarImagen } from "../../../utils/imagenes";
import { getConfigPuntos } from "../../../services/puntosService";
import ModalAsistenciaEvento from "../../../components/shared/ModalAsistenciaEvento";

const VACIO = {
  titulo: "", descripcion: "", categoria: "",
  fecha: "", hora: "", lugar: "", imagen: "", tipoPuntos: "",
};

const RED_THEME = {
  gradient:   "linear-gradient(135deg,#7f1d1d,#991b1b)",
  activeBtn:  "bg-red-800",
  inputFocus: "focus:border-red-400 focus:ring-2 focus:ring-red-100",
  dragActive: "border-red-400 bg-red-50",
  dragIdle:   "hover:border-red-300 hover:bg-red-50/50",
  uploadSpin: "border-red-200 border-t-red-700",
  loadSpin:   "border-red-100 border-t-red-700",
};

// ── Íconos ────────────────────────────────────────────────────────────────────
const IcEdit = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IcTrash = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IcUsers = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const IcX = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IcUpload = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

function estaVencido(fecha) {
  if (!fecha) return false;
  const [y, m, d] = fecha.split("-").map(Number);
  const limite = new Date();
  limite.setDate(limite.getDate() - 21);
  return new Date(y, m - 1, d) < limite;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TabEventos({ theme = RED_THEME, canManageCategorias = true }) {
  const [eventos, setEventos]           = useState([]);
  const [categorias, setCategorias]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [form, setForm]                 = useState(VACIO);
  const [editando, setEditando]         = useState(null);
  const [subiendo, setSubiendo]         = useState(false);
  const [guardando, setGuardando]       = useState(false);
  const [modal, setModal]               = useState(false);
  const [modalCat, setModalCat]         = useState(false);
  const [modalAsist, setModalAsist]     = useState(null);
  const [nuevaCat, setNuevaCat]         = useState("");
  const [confirmarEl, setConfirmarEl]   = useState(null);
  const [configPuntos, setConfigPuntos] = useState({});
  const [dragOver, setDragOver]         = useState(false);
  const [modoUrl, setModoUrl]           = useState(false);
  const [urlInput, setUrlInput]         = useState("");
  const [imgError, setImgError]         = useState(false);
  const inputFileRef                    = useRef(null);

  useEffect(() => {
    Promise.all([getEventos(), getCategorias(), getConfigPuntos()]).then(([ev, cats, cfg]) => {
      setEventos(ev);
      setCategorias(cats);
      setConfigPuntos(cfg);
      setLoading(false);
    });
  }, []);

  const abrirNuevo = () => {
    setForm(VACIO); setEditando(null);
    setModoUrl(false); setUrlInput(""); setImgError(false);
    setModal(true);
  };
  const abrirEditar = (e) => {
    setForm({ ...e }); setEditando(e.id);
    setUrlInput(e.imagen || ""); setImgError(false); setModoUrl(false);
    setModal(true);
  };

  const procesarArchivo = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSubiendo(true); setImgError(false);
    try {
      const url = await subirImagen(file);
      setForm((p) => ({ ...p, imagen: url }));
      setUrlInput(url);
    } catch {
      mostrarToast("Error al subir imagen. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleImagen = (e) => procesarArchivo(e.target.files[0]);
  const handleDrop   = (e) => { e.preventDefault(); setDragOver(false); procesarArchivo(e.dataTransfer.files[0]); };
  const aplicarUrl   = () => { setImgError(false); setForm((p) => ({ ...p, imagen: urlInput.trim() })); };
  const quitarImg    = () => { setForm((p) => ({ ...p, imagen: "" })); setUrlInput(""); setImgError(false); };

  const guardar = async () => {
    if (!form.titulo || !form.fecha || !form.categoria) {
      mostrarToast("Completa título, fecha y categoría.");
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        await actualizarEvento(editando, form);
        setEventos((prev) => prev.map((e) => e.id === editando ? { ...e, ...form } : e));
      } else {
        // crearEvento ahora retorna el ID — actualizamos estado sin re-leer Firestore
        const newId = await crearEvento(form);
        setEventos((prev) => [...prev, { id: newId, ...form, confirmados: [] }]);
      }
      setModal(false);
    } catch {
      mostrarToast("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    await eliminarEvento(id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setConfirmarEl(null);
  };

  const agregarCategoria = async () => {
    if (!nuevaCat.trim()) return;
    // crearCategoria ahora retorna el ID — actualizamos estado sin re-leer Firestore
    const newId = await crearCategoria(nuevaCat.trim());
    const nombre = nuevaCat.trim();
    setCategorias((prev) => [...prev, { id: newId, nombre }].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setNuevaCat("");
  };

  const borrarCategoria = async (id) => {
    await eliminarCategoria(id);
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  };

  const inputCls = `w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ${theme.inputFocus}`;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className={`h-8 w-8 animate-spin rounded-full border-4 ${theme.loadSpin}`} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">

      <div className="flex gap-3">
        <button
          onClick={abrirNuevo}
          className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95"
          style={{ background: theme.gradient }}
        >
          + Nuevo Evento
        </button>
        {canManageCategorias && (
          <button
            onClick={() => setModalCat(true)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Categorías
          </button>
        )}
      </div>

      {eventos.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">No hay eventos creados</p>
      )}

      <div className="flex flex-col gap-3">
        {eventos.map((ev) => {
          const vencido = estaVencido(ev.fecha);
          return (
            <div key={ev.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${vencido ? "border-red-200" : "border-slate-200"}`}>
              <div className={vencido ? "opacity-50" : ""}>
                {ev.imagen && (
                  <img
                    src={optimizarImagen(ev.imagen, 600)} alt={ev.titulo}
                    loading="lazy" decoding="async"
                    className="h-32 w-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                          {ev.categoria}
                        </span>
                        {ev.tipoPuntos && (
                          <span className="text-[10px] font-bold text-amber-600">
                            {ev.tipoPuntos.charAt(0).toUpperCase() + ev.tipoPuntos.slice(1).replace(/([A-Z])/g, " $1")}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 truncate">{ev.titulo}</p>
                      {ev.lugar && <p className="text-xs text-slate-500">📍 {ev.lugar}</p>}
                      <p className="text-xs text-slate-500">🗓 {ev.fecha}{ev.hora ? ` · ${ev.hora}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => setModalAsist(ev)}
                        className="rounded-xl bg-violet-50 p-2 text-violet-500 transition hover:bg-violet-100"
                        title="Ver asistentes"
                      >
                        <IcUsers />
                      </button>
                      <button onClick={() => abrirEditar(ev)} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                        <IcEdit />
                      </button>
                      <button onClick={() => setConfirmarEl(ev.id)} className="rounded-xl bg-red-50 p-2 text-red-400 hover:bg-red-100">
                        <IcTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {vencido && (
                <div className="flex items-center justify-between gap-3 border-t border-red-100 bg-red-50 px-4 py-2.5">
                  <p className="text-xs font-semibold text-red-400">Pasaron más de 3 semanas · Se sugiere eliminar</p>
                  <button
                    onClick={() => setConfirmarEl(ev.id)}
                    className="shrink-0 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600 active:scale-95"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal formulario evento */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6"
          onClick={() => setModal(false)}
        >
          <div
            className="w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-slate-800">
              {editando ? "Editar Evento" : "Nuevo Evento"}
            </h3>

            <div className="flex flex-col gap-4">

              {/* Imagen */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500">Imagen de portada</label>
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 text-[11px] font-semibold">
                    <button
                      onClick={() => setModoUrl(false)}
                      className={`px-3 py-1.5 transition ${!modoUrl ? `${theme.activeBtn} text-white` : "bg-white text-slate-400"}`}
                    >
                      Subir
                    </button>
                    <button
                      onClick={() => setModoUrl(true)}
                      className={`px-3 py-1.5 transition ${modoUrl ? `${theme.activeBtn} text-white` : "bg-white text-slate-400"}`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {form.imagen && !imgError && (
                  <div className="relative mb-3 overflow-hidden rounded-2xl">
                    <img
                      src={form.imagen} alt="preview"
                      className="h-36 w-full object-cover"
                      onError={() => setImgError(true)}
                      onLoad={() => setImgError(false)}
                    />
                    {!modoUrl && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        <span className="text-[10px] font-semibold text-white">Cloudinary</span>
                      </div>
                    )}
                    <button
                      onClick={quitarImg}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    >
                      <IcX />
                    </button>
                    <button
                      onClick={() => !modoUrl && inputFileRef.current?.click()}
                      className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white transition hover:bg-black/70"
                    >
                      <IcUpload />Cambiar
                    </button>
                  </div>
                )}

                {imgError && (
                  <div className="mb-3 rounded-xl bg-red-50 px-3 py-2">
                    <p className="text-xs text-red-500">No se pudo cargar la imagen. Verifica el link.</p>
                  </div>
                )}

                {!modoUrl && !form.imagen && (
                  <>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => inputFileRef.current?.click()}
                      className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition ${
                        dragOver ? theme.dragActive : `border-slate-200 bg-slate-50 ${theme.dragIdle}`
                      }`}
                    >
                      {subiendo ? (
                        <>
                          <div className={`h-6 w-6 animate-spin rounded-full border-2 ${theme.uploadSpin}`} />
                          <p className="text-xs text-slate-400">Subiendo a Cloudinary...</p>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-300"><IcUpload /></span>
                          <p className="text-xs font-medium text-slate-400">Toca para subir o arrastra aquí</p>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                            <p className="text-[10px] text-slate-300">Se guarda en Cloudinary · JPG, PNG, WEBP</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input ref={inputFileRef} type="file" accept="image/*" onChange={handleImagen} className="hidden" />
                  </>
                )}

                {modoUrl && (
                  <div className="flex gap-2">
                    <input
                      type="url" value={urlInput}
                      onChange={(e) => { setUrlInput(e.target.value); setImgError(false); }}
                      onBlur={aplicarUrl}
                      onKeyDown={(e) => e.key === "Enter" && aplicarUrl()}
                      placeholder="https://i.imgur.com/ejemplo.jpg"
                      className={`min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ${theme.inputFocus}`}
                    />
                    <button
                      onClick={aplicarUrl} disabled={!urlInput.trim()}
                      className="flex-shrink-0 rounded-2xl px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                      style={{ background: theme.gradient }}
                    >
                      Ver
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Título *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ej: Noche de Talentos UP JAS AQP"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  rows={3} placeholder="Describe el evento..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Categoría *</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Selecciona categoría</option>
                  {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Fecha *</label>
                  <input
                    type="date" value={form.fecha}
                    onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Hora</label>
                  <input
                    type="time" value={form.hora}
                    onChange={(e) => setForm((p) => ({ ...p, hora: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Lugar</label>
                <input
                  value={form.lugar}
                  onChange={(e) => setForm((p) => ({ ...p, lugar: e.target.value }))}
                  placeholder="Ej: Capilla UP JAS AQP - Arequipa"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Tipo de puntos</label>
                <select
                  value={form.tipoPuntos}
                  onChange={(e) => setForm((p) => ({ ...p, tipoPuntos: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Sin puntos</option>
                  {Object.entries(configPuntos)
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, val]) => (
                      <option key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")} — {val} pt{val !== 1 ? "s" : ""}
                      </option>
                    ))
                  }
                </select>
                {form.tipoPuntos && configPuntos[form.tipoPuntos] && (
                  <p className="mt-1.5 ml-1 text-xs font-semibold text-emerald-600">
                    ✓ El asistente recibirá {configPuntos[form.tipoPuntos]} punto{configPuntos[form.tipoPuntos] !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardar} disabled={guardando || subiendo}
                className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition disabled:opacity-60 active:scale-95"
                style={{ background: theme.gradient }}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal categorías (solo admin) */}
      {canManageCategorias && modalCat && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6"
          onClick={() => setModalCat(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-slate-800">Categorías de Eventos</h3>
            <div className="mb-4 flex gap-2">
              <input
                value={nuevaCat}
                onChange={(e) => setNuevaCat(e.target.value)}
                placeholder="Nueva categoría..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-400"
              />
              <button
                onClick={agregarCategoria}
                className="rounded-2xl px-4 py-3 text-sm font-bold text-white"
                style={{ background: "#991b1b" }}
              >
                +
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {categorias.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">{c.nombre}</span>
                  <button
                    onClick={() => borrarCategoria(c.id)}
                    className="text-xs font-semibold text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setModalCat(false)}
              className="mt-4 w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal asistencia */}
      {modalAsist && (
        <ModalAsistenciaEvento evento={modalAsist} onCerrar={() => setModalAsist(null)} />
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <IcTrash />
              </div>
            </div>
            <p className="mb-1 font-bold text-slate-800">¿Eliminar este evento?</p>
            <p className="mb-4 text-xs text-slate-400">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarEl(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminar(confirmarEl)}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
