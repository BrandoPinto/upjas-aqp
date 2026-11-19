import { useEffect, useState, useRef } from "react";
import { getClases, crearClase, actualizarClase, eliminarClase, getMaestros } from "../../../services/adminService";
import { subirImagen } from "../../../services/cloudinaryService";
import { mostrarToast } from "../../../services/toast";
import { optimizarImagen } from "../../../utils/imagenes";

const MODALIDADES = ["Presencial", "Virtual", "Híbrida"];
const DIAS        = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const VACIO = {
  titulo: "", descripcion: "", modalidad: "Presencial",
  dia: "Lunes", hora: "", maestroUid: "", maestroNombre: "", imagen: "",
};

const RED_THEME = {
  gradient:   "linear-gradient(135deg,#7f1d1d,#991b1b)",
  activeBtn:  "bg-red-800",
  inputFocus: "focus:border-red-400 focus:ring-2 focus:ring-red-100",
  dragActive: "border-red-400 bg-red-50",
  dragIdle:   "hover:border-red-300 hover:bg-red-50/50",
  uploadSpin: "border-red-200 border-t-red-700",
  loadSpin:   "border-red-100 border-t-red-700",
  badgeBg:    "bg-blue-100",
  badgeText:  "text-blue-700",
};

export default function TabClases({ theme = RED_THEME }) {
  const [clases, setClases]           = useState([]);
  const [maestros, setMaestros]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState(VACIO);
  const [editando, setEditando]       = useState(null);
  const [subiendo, setSubiendo]       = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [modal, setModal]             = useState(false);
  const [confirmarEl, setConfirmarEl] = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [modoUrl, setModoUrl]         = useState(false);
  const [urlInput, setUrlInput]       = useState("");
  const [imgError, setImgError]       = useState(false);
  const inputFileRef                  = useRef(null);

  useEffect(() => {
    Promise.all([getClases(), getMaestros()]).then(([cs, ms]) => {
      setClases(cs);
      setMaestros(ms);
      setLoading(false);
    });
  }, []);

  const abrirNueva = () => {
    setForm(VACIO); setEditando(null);
    setModoUrl(false); setUrlInput(""); setImgError(false);
    setModal(true);
  };

  const abrirEditar = (c) => {
    setForm({ ...c }); setEditando(c.id);
    setUrlInput(c.imagen || ""); setImgError(false); setModoUrl(false);
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
  const quitarImagen = () => { setForm((p) => ({ ...p, imagen: "" })); setUrlInput(""); setImgError(false); };

  const handleMaestro = (uid) => {
    const m = maestros.find((u) => u.uid === uid);
    setForm((prev) => ({
      ...prev,
      maestroUid: uid,
      maestroNombre: m ? `${m.name} ${m.lastName}` : "",
    }));
  };

  const guardar = async () => {
    if (!form.titulo || !form.hora || !form.maestroUid) {
      mostrarToast("Completa título, hora y maestro.");
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        await actualizarClase(editando, form);
        setClases((prev) => prev.map((c) => c.id === editando ? { ...c, ...form } : c));
      } else {
        // crearClase ahora retorna el ID — actualizamos estado sin re-leer Firestore
        const newId = await crearClase(form);
        setClases((prev) => [{ id: newId, ...form, inscritos: [] }, ...prev]);
      }
      setModal(false);
    } catch {
      mostrarToast("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    await eliminarClase(id);
    setClases((prev) => prev.filter((c) => c.id !== id));
    setConfirmarEl(null);
  };

  const inputCls = `w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ${theme.inputFocus}`;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className={`h-8 w-8 animate-spin rounded-full border-4 ${theme.loadSpin}`} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">

      <button
        onClick={abrirNueva}
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95"
        style={{ background: theme.gradient }}
      >
        + Nueva Clase
      </button>

      {clases.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">No hay clases creadas</p>
      )}

      <div className="flex flex-col gap-3">
        {clases.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {c.imagen && (
              <img
                src={optimizarImagen(c.imagen, 600)} alt={c.titulo}
                loading="lazy" decoding="async"
                className="h-32 w-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`mb-1 inline-block rounded-full ${theme.badgeBg} px-2 py-0.5 text-[10px] font-bold uppercase ${theme.badgeText}`}>
                    {c.modalidad}
                  </span>
                  <p className="font-bold text-slate-800">{c.titulo}</p>
                  <p className="text-xs text-slate-500">👤 {c.maestroNombre}</p>
                  <p className="text-xs text-slate-500">🕐 {c.dia} — {c.hora}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => abrirEditar(c)} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setConfirmarEl(c.id)} className="rounded-xl bg-red-50 p-2 text-red-400 hover:bg-red-100">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulario */}
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
              {editando ? "Editar Clase" : "Nueva Clase"}
            </h3>

            <div className="flex flex-col gap-4">

              {/* Imagen */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500">Imagen de portada</label>
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 text-[11px] font-semibold">
                    <button
                      onClick={() => setModoUrl(false)}
                      className={`px-3 py-1.5 transition ${!modoUrl ? `${theme.activeBtn} text-white` : "bg-white text-slate-400 hover:bg-slate-50"}`}
                    >
                      Subir
                    </button>
                    <button
                      onClick={() => setModoUrl(true)}
                      className={`px-3 py-1.5 transition ${modoUrl ? `${theme.activeBtn} text-white` : "bg-white text-slate-400 hover:bg-slate-50"}`}
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
                      onClick={quitarImagen}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => !modoUrl && inputFileRef.current?.click()}
                      className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white transition hover:bg-black/70"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Cambiar
                    </button>
                  </div>
                )}

                {imgError && (
                  <div className="mb-3 rounded-xl bg-red-50 px-3 py-2">
                    <p className="text-xs text-red-500">No se pudo cargar. Verifica que el link sea público y directo.</p>
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
                          <p className="text-xs font-medium text-slate-400">Subiendo a Cloudinary...</p>
                        </>
                      ) : (
                        <>
                          <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
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
                      className="flex-shrink-0 rounded-2xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-40 active:scale-95"
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
                  placeholder="Ej: Evangelios del Nuevo Testamento"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  rows={3} placeholder="Describe el contenido de la clase..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Modalidad</label>
                <select
                  value={form.modalidad}
                  onChange={(e) => setForm((p) => ({ ...p, modalidad: e.target.value }))}
                  className={inputCls}
                >
                  {MODALIDADES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Día</label>
                  <select
                    value={form.dia}
                    onChange={(e) => setForm((p) => ({ ...p, dia: e.target.value }))}
                    className={inputCls}
                  >
                    {DIAS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Hora *</label>
                  <input
                    type="time" value={form.hora}
                    onChange={(e) => setForm((p) => ({ ...p, hora: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Maestro *</label>
                <select
                  value={form.maestroUid}
                  onChange={(e) => handleMaestro(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecciona un maestro</option>
                  {maestros.map((m) => (
                    <option key={m.uid} value={m.uid}>{m.name} {m.lastName}</option>
                  ))}
                </select>
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

      {/* Modal confirmar eliminar */}
      {confirmarEl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <p className="mb-1 font-bold text-slate-800">¿Eliminar clase?</p>
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
