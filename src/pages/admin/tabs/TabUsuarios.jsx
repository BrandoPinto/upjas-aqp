import { useEffect, useRef, useState } from "react";
import { getTodosUsuarios, getUsuariosPagina, otorgarPuntosAdmin, eliminarUsuario, getHistorialPuntos, eliminarEntradaHistorial } from "../../../services/adminService";
import { getConfigPuntos } from "../../../services/puntosService";
import { useAuth } from "../../../context/AuthContext";
import { TIPOS_PUNTOS as TIPOS } from "../../../constants/puntos";
import { mostrarToast } from "../../../services/toast";

const PAGE_SIZE = 10;

function calcularEdad(birthDate) {
  if (!birthDate) return null;
  const hoy = new Date();
  const nac = new Date(birthDate + "T00:00:00");
  if (isNaN(nac)) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return isNaN(edad) ? null : edad;
}

function formatFecha(createdAt) {
  if (!createdAt) return "—";
  const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TabUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios]           = useState([]);
  const [pagina, setPagina]               = useState(0);
  const [hayMas, setHayMas]               = useState(false);
  const [cargandoPag, setCargandoPag]     = useState(false);
  const [allUsersCache, setAllUsersCache] = useState(null);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [generandoPDF, setGenerandoPDF]   = useState(false);
  const [filtro, setFiltro]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [seleccionado, setSeleccionado]     = useState(null);
  const [config, setConfig]                = useState(null);
  const [dando, setDando]                  = useState(false);
  const [mensaje, setMensaje]              = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [eliminando, setEliminando]        = useState(false);
  const [historialUsuario, setHistorialUsuario]   = useState(null);
  const [historial, setHistorial]                 = useState([]);
  const [historialCursor, setHistorialCursor]     = useState(null);
  const [historialHayMas, setHistorialHayMas]     = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [cargandoMas, setCargandoMas]             = useState(false);
  const [eliminandoEntrada, setEliminandoEntrada] = useState(null);
  const allUsersFetched = useRef(false);
  const debounceRef     = useRef(null);
  // cursoresRef.current[i] = startAfter doc para cargar la página i
  const cursoresRef     = useRef([null]);

  const cargarPagina = async (numPag) => {
    setCargandoPag(true);
    const cursor = cursoresRef.current[numPag] ?? null;
    const resultado = await getUsuariosPagina(cursor, PAGE_SIZE);
    setUsuarios(resultado.usuarios);
    setHayMas(resultado.hayMas);
    setPagina(numPag);
    if (resultado.hayMas && !cursoresRef.current[numPag + 1]) {
      cursoresRef.current = [...cursoresRef.current];
      cursoresRef.current[numPag + 1] = resultado.cursor;
    }
    setCargandoPag(false);
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const [cfg] = await Promise.all([getConfigPuntos(), cargarPagina(0)]);
        setConfig(cfg);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Carga lazy del listado completo la primera vez que se activa la búsqueda
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (filtro.trim().length < 2 || allUsersFetched.current) return;
    debounceRef.current = setTimeout(async () => {
      if (allUsersFetched.current) return;
      setCargandoBusqueda(true);
      const todos = await getTodosUsuarios();
      allUsersFetched.current = true;
      setAllUsersCache(todos);
      setCargandoBusqueda(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [filtro]);

  const busquedaActiva = filtro.trim().length >= 2;
  const listaBase = busquedaActiva && allUsersCache ? allUsersCache : usuarios;
  const mostrar = busquedaActiva
    ? listaBase.filter((u) => {
        const t = filtro.toLowerCase();
        return (
          u.name?.toLowerCase().includes(t) ||
          u.lastName?.toLowerCase().includes(t) ||
          u.email?.toLowerCase().includes(t) ||
          u.codigoJAS?.toLowerCase().includes(t)
        );
      })
    : listaBase;

  const actualizarPuntos = (uid, valor) => {
    const up = (list) =>
      list.map((u) => (u.uid === uid || u.id === uid) ? { ...u, puntos: (u.puntos ?? 0) + valor } : u);
    setUsuarios(up);
    if (allUsersCache) setAllUsersCache(up);
  };

  const darPunto = async (tipo) => {
    if (!seleccionado) return;
    setDando(true);
    setMensaje(null);
    try {
      const valor = await otorgarPuntosAdmin({
        uidReceptor: seleccionado.uid,
        uidAdmin: user.uid,
        tipo,
      });
      setMensaje({ text: `+${valor} pts otorgados ✓`, type: "success" });
      setSeleccionado((prev) => ({ ...prev, puntos: (prev.puntos ?? 0) + valor }));
      actualizarPuntos(seleccionado.uid, valor);
    } catch (err) {
      setMensaje({ text: err.message, type: "error" });
    } finally {
      setDando(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirmarEliminar) return;
    setEliminando(true);
    try {
      await eliminarUsuario(confirmarEliminar.uid);
      const remover = (list) => list.filter((u) => (u.uid || u.id) !== confirmarEliminar.uid);
      setUsuarios(remover);
      if (allUsersCache) setAllUsersCache(remover);
      if (seleccionado?.uid === confirmarEliminar.uid) { setSeleccionado(null); setMensaje(null); }
      setConfirmarEliminar(null);
    } catch (err) {
      mostrarToast(err.message ?? "Error al eliminar el usuario.");
    } finally {
      setEliminando(false);
    }
  };

  const EMOJI_TIPO = { asistencia: "📚", actividadPequena: "🎯", actividadGrande: "🏆", invitacion: "🤝", plus: "⭐", gasto: "💸" };
  const ROL_LABEL  = { admin: "Admin", maestro: "Maestro", lider: "Líder" };

  const abrirHistorial = async (e, u) => {
    e.stopPropagation();
    setHistorialUsuario(u);
    setHistorial([]);
    setHistorialCursor(null);
    setHistorialHayMas(false);
    setCargandoHistorial(true);
    try {
      const res = await getHistorialPuntos(u.uid || u.id);
      setHistorial(res.entradas);
      setHistorialCursor(res.cursorDoc);
      setHistorialHayMas(res.hayMas);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cargarMasHistorial = async () => {
    if (!historialUsuario || !historialCursor) return;
    setCargandoMas(true);
    try {
      const res = await getHistorialPuntos(historialUsuario.uid || historialUsuario.id, historialCursor);
      setHistorial((prev) => [...prev, ...res.entradas]);
      setHistorialCursor(res.cursorDoc);
      setHistorialHayMas(res.hayMas);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoMas(false);
    }
  };

  const handleEliminarEntrada = async (entrada) => {
    const uid = historialUsuario.uid || historialUsuario.id;
    setEliminandoEntrada(entrada.id);
    try {
      await eliminarEntradaHistorial(uid, entrada.id, entrada.valor);
      setHistorial((prev) => prev.filter((h) => h.id !== entrada.id));
      actualizarPuntos(uid, -entrada.valor);
      setHistorialUsuario((prev) => ({ ...prev, puntos: Math.max(0, (prev.puntos ?? 0) - entrada.valor) }));
    } catch (err) {
      mostrarToast(err.message ?? "Error al eliminar la entrada.");
    } finally {
      setEliminandoEntrada(null);
    }
  };

  const generarPDF = async () => {
    setGenerandoPDF(true);
    try {
      // Reutiliza la caché de búsqueda si ya fue cargada
      let todos = allUsersCache;
      if (!todos) {
        todos = await getTodosUsuarios();
        allUsersFetched.current = true;
        setAllUsersCache(todos);
      }

      const { jsPDF }              = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const pdf   = new jsPDF();
      const pageW = pdf.internal.pageSize.getWidth();
      const ahora = new Date().toLocaleDateString("es-PE", {
        day: "2-digit", month: "long", year: "numeric",
      });

      // ── Encabezado ──────────────────────────────────────────────
      pdf.setFillColor(127, 29, 29);
      pdf.rect(0, 0, pageW, 28, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("Reporte de Usuarios", 14, 11);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      pdf.text(`Total registrados: ${todos.length}`, 14, 21);
      pdf.text(`Generado: ${ahora}`, pageW - 14, 21, { align: "right" });

      // ── Tabla ────────────────────────────────────────────────────
      autoTable(pdf, {
        startY: 34,
        head: [["#", "Nombre completo", "Estaca", "Barrio", "Edad", "Correo", "Registro"]],
        body: todos.map((u, i) => {
          const edad  = calcularEdad(u.birthDate);
          const fecha = formatFecha(u.createdAt);
          return [
            i + 1,
            `${u.name ?? ""} ${u.lastName ?? ""}`.trim() || "—",
            u.stateValue ?? "—",
            u.parish     ?? "—",
            edad != null ? `${edad} años` : "—",
            u.email      ?? "—",
            fecha,
          ];
        }),
        headStyles: {
          fillColor: [127, 29, 29],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize:  8,
        },
        bodyStyles:         { fontSize: 8 },
        alternateRowStyles: { fillColor: [253, 245, 245] },
        columnStyles: {
          0: { cellWidth: 8,  halign: "center" },
          4: { cellWidth: 18, halign: "center" },
        },
        margin: { left: 10, right: 10 },
      });

      // ── Pie ──────────────────────────────────────────────────────
      const finalY = pdf.lastAutoTable.finalY + 6;
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total: ${todos.length} usuario${todos.length !== 1 ? "s" : ""}`, 10, finalY);
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text(`UP JAS AQP · ${ahora}`, pageW - 10, finalY, { align: "right" });

      pdf.save(`usuarios-upjasaqp-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      mostrarToast("Error al generar el reporte. Intenta de nuevo.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">

      {/* Buscador + botón PDF */}
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o JAS..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {filtro.length > 0 && (
            <button onClick={() => setFiltro("")} className="text-slate-400 hover:text-slate-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Botón reporte PDF */}
        <button
          onClick={generarPDF}
          disabled={generandoPDF}
          title="Descargar reporte PDF de todos los usuarios"
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm transition hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
        >
          {generandoPDF ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-200 border-t-red-700" />
          ) : (
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </button>
      </div>

      {cargandoBusqueda && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {mostrar.map((u) => {
          const esYo = (u.uid || u.id) === user.uid;
          return (
            <div
              key={u.uid || u.id}
              onClick={() => { setSeleccionado(u); setMensaje(null); }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 cursor-pointer transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm font-bold text-red-700">
                {u.name?.[0]}{u.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">{u.name} {u.lastName}</p>
                <p className="text-xs text-slate-400">{u.codigoJAS} · {u.email}</p>
              </div>
              <div className="shrink-0 text-right mr-1">
                <p className="text-sm font-bold text-slate-700">⭐ {u.puntos ?? 0}</p>
                <p className="text-[10px] text-slate-400">{u.roles?.length ? u.roles.join(", ") : "usuario"}</p>
              </div>
              <button
                onClick={(e) => abrirHistorial(e, u)}
                className="shrink-0 rounded-xl bg-amber-50 p-2 text-amber-500 transition hover:bg-amber-100"
                title="Historial de puntos"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {!esYo && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmarEliminar(u); }}
                  className="shrink-0 rounded-xl bg-red-50 p-2 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                  title="Eliminar usuario"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}

        {!busquedaActiva && !cargandoPag && mostrar.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No hay usuarios</p>
        )}
        {busquedaActiva && !cargandoBusqueda && mostrar.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Sin resultados para "{filtro}"</p>
        )}
      </div>

      {/* Paginación — solo cuando no hay búsqueda activa */}
      {!busquedaActiva && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarPagina(pagina - 1)}
            disabled={pagina === 0 || cargandoPag}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
          >
            ← Anterior
          </button>

          <div className="flex shrink-0 items-center justify-center w-16">
            {cargandoPag ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            ) : (
              <span className="text-sm font-bold text-slate-500">Pág. {pagina + 1}</span>
            )}
          </div>

          <button
            onClick={() => cargarPagina(pagina + 1)}
            disabled={!hayMas || cargandoPag}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <p className="mb-1 font-bold text-slate-800">¿Eliminar usuario?</p>
            <p className="mb-1 text-sm font-semibold text-slate-600">
              {confirmarEliminar.name} {confirmarEliminar.lastName}
            </p>
            <p className="mb-5 text-xs text-slate-400">
              Se eliminará su cuenta y no podrá volver a registrarse con este correo ni teléfono.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarEliminar(null)}
                disabled={eliminando}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60 active:scale-95"
              >
                {eliminando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Eliminando...
                  </span>
                ) : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historial de puntos */}
      {historialUsuario && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6"
          onClick={() => setHistorialUsuario(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white shadow-xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historial de puntos</p>
                <p className="font-bold text-slate-800 mt-0.5">{historialUsuario.name} {historialUsuario.lastName}</p>
                <p className="text-xs text-slate-400">⭐ {historialUsuario.puntos ?? 0} pts actuales</p>
              </div>
              <button
                onClick={() => setHistorialUsuario(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 flex-1">
              {cargandoHistorial ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-100 border-t-amber-500" />
                </div>
              ) : historial.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Sin historial de puntos</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {historial.map((h) => {
                    const fecha = h.fecha?.toDate?.().toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) ?? "—";
                    const positivo = h.valor >= 0;
                    return (
                      <div key={h.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                        <span className="text-lg shrink-0">{EMOJI_TIPO[h.tipo] ?? "•"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{h.descripcion}</p>
                          <p className="text-[10px] text-slate-400">{fecha} · {ROL_LABEL[h.rolOtorgante] ?? h.rolOtorgante}</p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${positivo ? "text-emerald-600" : "text-red-500"}`}>
                          {positivo ? "+" : ""}{h.valor}
                        </span>
                        <button
                          onClick={() => handleEliminarEntrada(h)}
                          disabled={eliminandoEntrada === h.id}
                          className="shrink-0 rounded-lg bg-red-50 p-1.5 text-red-400 transition hover:bg-red-100 disabled:opacity-50"
                          title="Eliminar entrada"
                        >
                          {eliminandoEntrada === h.id ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {historialHayMas && (
                    <button
                      onClick={cargarMasHistorial}
                      disabled={cargandoMas}
                      className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {cargandoMas ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                          Cargando...
                        </span>
                      ) : "Cargar más"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setHistorialUsuario(null)}
                className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal dar puntos */}
      {seleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6"
          onClick={() => { setSeleccionado(null); setMensaje(null); }}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-lg font-bold text-red-700">
                {seleccionado.name?.[0]}{seleccionado.lastName?.[0]}
              </div>
              <div>
                <p className="font-bold text-slate-800">{seleccionado.name} {seleccionado.lastName}</p>
                <p className="text-xs text-slate-400">{seleccionado.codigoJAS} · ⭐ {seleccionado.puntos ?? 0} pts</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 mb-4" />

            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Otorgar puntos</p>

            {mensaje && (
              <div className={`mb-3 rounded-xl px-3 py-2 text-sm font-semibold text-center ${
                mensaje.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}>{mensaje.text}</div>
            )}

            <div className="flex flex-col gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => darPunto(t.key)}
                  disabled={dando}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span>{t.emoji}</span>{t.label}
                  </span>
                  <span className="text-xs font-bold text-red-600">+{config?.[t.key]} pts</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setSeleccionado(null); setMensaje(null); }}
              className="mt-4 w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
