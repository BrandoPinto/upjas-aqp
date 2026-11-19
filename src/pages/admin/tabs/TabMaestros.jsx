import { useEffect, useState } from "react";
import { getTodosUsuarios, asignarRol, quitarRol } from "../../../services/adminService";

const PAGE_SIZE = 10;

// Fuera del componente para evitar que React la desmonte/remonte en cada render (causaba pérdida de foco)
function SeccionRol({ activos, noActivos, filtro, setFiltro, rol, colorActivo, colorAsignar, onAsignar, onQuitar, accion }) {
  const [pagina, setPagina] = useState(0);

  // Resetear página al cambiar filtro
  useEffect(() => { setPagina(0); }, [filtro]);

  const inicio      = pagina * PAGE_SIZE;
  const paginados   = noActivos.slice(inicio, inicio + PAGE_SIZE);
  const haySiguiente = inicio + PAGE_SIZE < noActivos.length;

  return (
    <div className="flex flex-col gap-5">

      {/* Activos */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Activos ({activos.length})
        </p>
        {activos.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-4">No hay asignados</p>
        )}
        <div className="flex flex-col gap-2">
          {activos.map((u) => (
            <div
              key={u.uid}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: colorActivo.bg, border: `1px solid ${colorActivo.border}` }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{ background: colorActivo.avatar, color: colorActivo.avatarText }}
              >
                {u.name?.[0]}{u.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">{u.name} {u.lastName}</p>
                <p className="text-xs text-slate-500">{u.codigoJAS}</p>
              </div>
              <button
                onClick={() => onQuitar(u.uid, rol)}
                disabled={accion === u.uid + rol}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                {accion === u.uid + rol ? "..." : "Quitar"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* Asignar */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Asignar
        </p>
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar usuario..."
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

        <div className="flex flex-col gap-2">
          {paginados.map((u) => (
            <div
              key={u.uid}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                {u.name?.[0]}{u.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">{u.name} {u.lastName}</p>
                <p className="text-xs text-slate-400">{u.codigoJAS}</p>
              </div>
              <button
                onClick={() => onAsignar(u.uid, rol)}
                disabled={accion === u.uid + rol}
                className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
                style={{ background: colorAsignar }}
              >
                {accion === u.uid + rol ? "..." : "Asignar"}
              </button>
            </div>
          ))}

          {noActivos.length === 0 && filtro && (
            <p className="text-center text-sm text-slate-400 py-4">Sin resultados</p>
          )}
          {noActivos.length === 0 && !filtro && (
            <p className="text-center text-sm text-slate-400 py-4">Escribe para buscar</p>
          )}
        </div>

        {/* Paginación */}
        {noActivos.length > PAGE_SIZE && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setPagina((p) => p - 1)}
              disabled={pagina === 0}
              className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
            >
              ← Anterior
            </button>
            <span className="shrink-0 w-14 text-center text-sm font-bold text-slate-500">
              Pág. {pagina + 1}
            </span>
            <button
              onClick={() => setPagina((p) => p + 1)}
              disabled={!haySiguiente}
              className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TabMaestros() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroM, setFiltroM]   = useState("");
  const [filtroL, setFiltroL]   = useState("");
  const [filtroA, setFiltroA]   = useState("");
  const [filtroB, setFiltroB]   = useState("");
  const [loading, setLoading]   = useState(true);
  const [accion, setAccion]     = useState(null);
  const [tabActiva, setTabActiva] = useState("maestros");

  useEffect(() => {
    getTodosUsuarios().then((us) => { setUsuarios(us); setLoading(false); });
  }, []);

  const getRoles = (u) => Array.isArray(u.roles) ? u.roles : [];

  // ── Maestros ──
  const maestros = usuarios.filter((u) => getRoles(u).includes("maestro"));
  const noMaestros = usuarios.filter((u) => {
    const t = filtroM.toLowerCase();
    return (
      !getRoles(u).includes("maestro") &&
      (u.name?.toLowerCase().includes(t) ||
       u.lastName?.toLowerCase().includes(t) ||
       u.codigoJAS?.toLowerCase().includes(t))
    );
  });

  // ── Líderes ──
  const lideres = usuarios.filter((u) => getRoles(u).includes("lider"));
  const noLideres = usuarios.filter((u) => {
    const t = filtroL.toLowerCase();
    return (
      !getRoles(u).includes("lider") &&
      (u.name?.toLowerCase().includes(t) ||
       u.lastName?.toLowerCase().includes(t) ||
       u.codigoJAS?.toLowerCase().includes(t))
    );
  });

  // ── Comité de bienvenida ──
  const bienvenida = usuarios.filter((u) => getRoles(u).includes("bienvenida"));
  const noBienvenida = usuarios.filter((u) => {
    const t = filtroB.toLowerCase();
    return (
      !getRoles(u).includes("bienvenida") &&
      (u.name?.toLowerCase().includes(t) ||
       u.lastName?.toLowerCase().includes(t) ||
       u.codigoJAS?.toLowerCase().includes(t))
    );
  });

  // ── Admins ──
  const admins = usuarios.filter((u) => getRoles(u).includes("admin"));
  const noAdmins = usuarios.filter((u) => {
    const t = filtroA.toLowerCase();
    return (
      !getRoles(u).includes("admin") &&
      (u.name?.toLowerCase().includes(t) ||
       u.lastName?.toLowerCase().includes(t) ||
       u.codigoJAS?.toLowerCase().includes(t))
    );
  });

  const asignar = async (uid, rol) => {
    setAccion(uid + rol);
    await asignarRol(uid, rol);
    setUsuarios((prev) =>
      prev.map((u) =>
        u.uid === uid ? { ...u, roles: [...getRoles(u), rol] } : u
      )
    );
    setAccion(null);
  };

  const quitar = async (uid, rol) => {
    setAccion(uid + rol);
    await quitarRol(uid, rol);
    setUsuarios((prev) =>
      prev.map((u) =>
        u.uid === uid ? { ...u, roles: getRoles(u).filter((r) => r !== rol) } : u
      )
    );
    setAccion(null);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
    </div>
  );

  const TabBtn = ({ id, label, count, color }) => (
    <button
      onClick={() => setTabActiva(id)}
      className="flex-1 rounded-2xl px-1 py-3 text-xs font-bold transition"
      style={{
        background: tabActiva === id ? color : "transparent",
        color: tabActiva === id ? "#fff" : "#94a3b8",
        border: tabActiva === id ? "none" : "1px solid #e2e8f0",
      }}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">

      {/* Tabs */}
      <div className="flex gap-2">
        <TabBtn id="maestros" label="Maestros" count={maestros.length} color="#065f46" />
        <TabBtn id="lideres"  label="Líderes"  count={lideres.length}  color="#4c1d95" />
        <TabBtn id="bienvenida" label="Bienvenida" count={bienvenida.length} color="#0e7490" />
        <TabBtn id="admins"   label="Admins"   count={admins.length}   color="#7f1d1d" />
      </div>

      {tabActiva === "maestros" && (
        <SeccionRol
          activos={maestros}
          noActivos={noMaestros}
          filtro={filtroM}
          setFiltro={setFiltroM}
          rol="maestro"
          colorActivo={{ bg: "#f0fdf4", border: "#bbf7d0", avatar: "#d1fae5", avatarText: "#065f46" }}
          colorAsignar="#065f46"
          onAsignar={asignar}
          onQuitar={quitar}
          accion={accion}
        />
      )}

      {tabActiva === "lideres" && (
        <SeccionRol
          activos={lideres}
          noActivos={noLideres}
          filtro={filtroL}
          setFiltro={setFiltroL}
          rol="lider"
          colorActivo={{ bg: "#f5f3ff", border: "#ddd6fe", avatar: "#ede9fe", avatarText: "#4c1d95" }}
          colorAsignar="#4c1d95"
          onAsignar={asignar}
          onQuitar={quitar}
          accion={accion}
        />
      )}

      {tabActiva === "bienvenida" && (
        <SeccionRol
          activos={bienvenida}
          noActivos={noBienvenida}
          filtro={filtroB}
          setFiltro={setFiltroB}
          rol="bienvenida"
          colorActivo={{ bg: "#ecfeff", border: "#a5f3fc", avatar: "#cffafe", avatarText: "#155e75" }}
          colorAsignar="#0e7490"
          onAsignar={asignar}
          onQuitar={quitar}
          accion={accion}
        />
      )}

      {tabActiva === "admins" && (
        <SeccionRol
          activos={admins}
          noActivos={noAdmins}
          filtro={filtroA}
          setFiltro={setFiltroA}
          rol="admin"
          colorActivo={{ bg: "#fff1f2", border: "#fecdd3", avatar: "#fecdd3", avatarText: "#7f1d1d" }}
          colorAsignar="#7f1d1d"
          onAsignar={asignar}
          onQuitar={quitar}
          accion={accion}
        />
      )}

    </div>
  );
}
