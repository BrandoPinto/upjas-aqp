import { useEffect, useState } from "react";
import { getConfigPuntos } from "../../../services/puntosService";
import { actualizarConfigPuntos, getTopUsuariosPuntos, getHistorialPuntos } from "../../../services/adminService";

const TIPOS = [
  { key: "asistencia",       label: "Asistencia a Instituto",         emoji: "📚" },
  { key: "actividadPequena", label: "Actividad Pequeña",              emoji: "🎯" },
  { key: "actividadGrande",  label: "Actividad Grande",               emoji: "🏆" },
  { key: "invitacion",       label: "Invitación a un amigo",          emoji: "🤝" },
  { key: "plus",             label: "Plus",                           emoji: "⭐" },
];

const RANKING_PAGE_SIZE = 10; // top 20 en 2 páginas de 10, todo en memoria (una sola lectura)
const MEDALLA = { 0: "🥇", 1: "🥈", 2: "🥉" };
const GENERO_LABEL   = { masculino: "Masculino", femenino: "Femenino" };
const RELACION_LABEL = { miembro: "Miembro", invitado: "Invitado" };
const EMOJI_TIPO = { asistencia: "📚", actividadPequena: "🎯", actividadGrande: "🏆", invitacion: "🤝", plus: "⭐", gasto: "💸" };
const ROL_LABEL  = { admin: "Admin", maestro: "Maestro", lider: "Líder" };

// El doc de usuario ya viene completo desde getTopUsuariosPuntos (Firestore
// siempre trae el documento entero) — no hace falta ninguna lectura extra.
function calcularEdad(birthDate) {
  if (!birthDate) return null;
  const nac = new Date(birthDate + "T00:00:00");
  if (isNaN(nac)) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return isNaN(edad) ? null : edad;
}

export default function TabPuntos() {
  const [config, setConfig]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const [ranking, setRanking]             = useState([]);
  const [cargandoRanking, setCargandoRanking] = useState(true);
  const [errorRanking, setErrorRanking]   = useState(false);
  const [paginaRanking, setPaginaRanking] = useState(0);
  const [perfilVer, setPerfilVer]         = useState(null);

  const [historialUsuario, setHistorialUsuario]   = useState(null);
  const [historial, setHistorial]                 = useState([]);
  const [historialCursor, setHistorialCursor]     = useState(null);
  const [historialHayMas, setHistorialHayMas]     = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [cargandoMasHistorial, setCargandoMasHistorial] = useState(false);

  const cargarRanking = () => {
    setCargandoRanking(true);
    setErrorRanking(false);
    getTopUsuariosPuntos(20)
      .then((r) => { setRanking(r); setPaginaRanking(0); })
      .catch((err) => { console.error("Error cargando ranking:", err); setErrorRanking(true); })
      .finally(() => setCargandoRanking(false));
  };

  useEffect(() => {
    getConfigPuntos().then((c) => { setConfig(c); setLoading(false); });
    cargarRanking();
  }, []);

  // Solo se consulta al abrir el historial de alguien puntual, paginado de 10 en 10
  const abrirHistorial = async (u) => {
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
      console.error("Error cargando historial:", err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cargarMasHistorial = async () => {
    if (!historialUsuario || !historialCursor) return;
    setCargandoMasHistorial(true);
    try {
      const res = await getHistorialPuntos(historialUsuario.uid || historialUsuario.id, historialCursor);
      setHistorial((prev) => [...prev, ...res.entradas]);
      setHistorialCursor(res.cursorDoc);
      setHistorialHayMas(res.hayMas);
    } catch (err) {
      console.error("Error cargando más historial:", err);
    } finally {
      setCargandoMasHistorial(false);
    }
  };

  const totalPaginasRanking = Math.max(1, Math.ceil(ranking.length / RANKING_PAGE_SIZE));
  const rankingPagina = ranking.slice(
    paginaRanking * RANKING_PAGE_SIZE,
    paginaRanking * RANKING_PAGE_SIZE + RANKING_PAGE_SIZE
  );

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarConfigPuntos(config);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch { alert("Error al guardar"); }
    finally { setGuardando(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-red-100 border-t-red-700" /></div>;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="mb-1 text-base font-bold text-slate-800">Configuración de Puntos</p>
        <p className="mb-5 text-sm text-slate-400">Define cuántos puntos otorga cada acción.</p>

        <div className="flex flex-col gap-4">
          {TIPOS.map((t) => (
            <div key={t.key} className="flex items-center gap-3">
              <span className="text-xl">{t.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">{t.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfig((p) => ({ ...p, [t.key]: Math.max(1, (p[t.key] ?? 1) - 1) }))}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                >−</button>
                <span className="w-8 text-center text-sm font-bold text-slate-800">{config[t.key]}</span>
                <button
                  onClick={() => setConfig((p) => ({ ...p, [t.key]: (p[t.key] ?? 1) + 1 }))}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                >+</button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={guardar}
          disabled={guardando}
          className="mt-6 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}
        >
          {guardado ? "✓ Guardado" : guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-base font-bold text-slate-800">Top 20 · Más puntos</p>
            <p className="text-sm text-slate-400">Ranking de los usuarios con más puntos acumulados.</p>
          </div>
          <button
            onClick={cargarRanking}
            disabled={cargandoRanking}
            title="Actualizar ranking"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${cargandoRanking ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {cargandoRanking ? (
          <div className="flex justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
          </div>
        ) : errorRanking ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-center text-sm text-slate-400">No se pudo cargar el ranking.</p>
            <button
              onClick={cargarRanking}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Reintentar
            </button>
          </div>
        ) : ranking.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Todavía no hay usuarios con puntos</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {rankingPagina.map((u, i) => {
                const puesto = paginaRanking * RANKING_PAGE_SIZE + i;
                return (
                  <button
                    key={u.uid || u.id}
                    onClick={() => setPerfilVer(u)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-500 shadow-sm">
                      {MEDALLA[puesto] ?? `#${puesto + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">{u.name} {u.lastName}</p>
                      <p className="text-xs text-slate-400">{u.codigoJAS ?? "—"}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-red-700">⭐ {u.puntos ?? 0}</p>
                  </button>
                );
              })}
            </div>

            {totalPaginasRanking > 1 && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => setPaginaRanking((p) => Math.max(0, p - 1))}
                  disabled={paginaRanking === 0}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                >
                  ← Anterior
                </button>
                <span className="shrink-0 w-20 text-center text-sm font-bold text-slate-500">
                  Pág. {paginaRanking + 1}/{totalPaginasRanking}
                </span>
                <button
                  onClick={() => setPaginaRanking((p) => Math.min(totalPaginasRanking - 1, p + 1))}
                  disabled={paginaRanking >= totalPaginasRanking - 1}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal perfil (usa los datos ya cargados en el ranking, sin lecturas extra) */}
      {perfilVer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6"
          onClick={() => setPerfilVer(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-lg font-bold text-red-700">
                {perfilVer.name?.[0]}{perfilVer.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-800">{perfilVer.name} {perfilVer.lastName}</p>
                <p className="text-xs text-slate-400">{perfilVer.codigoJAS ?? "—"} · ⭐ {perfilVer.puntos ?? 0} pts</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 mb-4" />

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Estaca",   perfilVer.stateValue ?? "—"],
                ["Barrio",   perfilVer.parish ?? "—"],
                ["Relación", RELACION_LABEL[perfilVer.relation] ?? "—"],
                ["Edad",     calcularEdad(perfilVer.birthDate) != null ? `${calcularEdad(perfilVer.birthDate)} años` : "—"],
                ["Género",   GENERO_LABEL[perfilVer.gender] ?? "—"],
                ["Teléfono", perfilVer.phone ?? "—"],
              ].map(([label, valor]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="truncate text-sm font-semibold text-slate-700">{valor}</p>
                </div>
              ))}
              <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Correo</p>
                <p className="truncate text-sm font-semibold text-slate-700">{perfilVer.email ?? "—"}</p>
              </div>
            </div>

            <button
              onClick={() => { const u = perfilVer; setPerfilVer(null); abrirHistorial(u); }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-50 py-3 text-sm font-bold text-amber-600 transition hover:bg-amber-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ver historial de puntos
            </button>

            <button
              onClick={() => setPerfilVer(null)}
              className="mt-2 w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
            >
              Cerrar
            </button>
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
                      </div>
                    );
                  })}

                  {historialHayMas && (
                    <button
                      onClick={cargarMasHistorial}
                      disabled={cargandoMasHistorial}
                      className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {cargandoMasHistorial ? (
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
    </div>
  );
}