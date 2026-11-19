import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../../context/AuthContext";
import { getUsuarioPorUID, otorgarPuntos, getConfigPuntos } from "../../services/puntosService";
import { mostrarToast } from "../../services/toast";
import { formatearFechaIso } from "../../utils/fechas";

const errorCamara = (err) => {
  const n = err?.name ?? "";
  if (n === "NotAllowedError" || n === "PermissionDeniedError")
    return "Permiso de cámara denegado. Habilítalo en la configuración del navegador.";
  if (n === "NotFoundError" || n === "DevicesNotFoundError")
    return "No se encontró cámara en este dispositivo.";
  if (n === "SecurityError" || n === "NotSupportedError")
    return "La cámara requiere conexión segura (HTTPS).";
  if (n === "NotReadableError" || n === "TrackStartError")
    return "La cámara está siendo usada por otra aplicación.";
  return "No se pudo acceder a la cámara. Verifica permisos e intenta de nuevo.";
};

// html5-qrcode inyecta style="display:block" inline en el contenedor,
// lo que sobreescribe la clase "hidden" de Tailwind al cerrar la cámara.
// Esta función elimina esos estilos residuales para evitar la pantalla en blanco.
function resetContenedor(id) {
  const el = document.getElementById(id);
  if (el) {
    el.removeAttribute("style");
    el.innerHTML = "";
  }
}

// Si los eventos de hoy se cargaron hace más de esto, se vuelven a consultar al abrir la cámara
const VIGENCIA_EVENTOS_MS = 5 * 60 * 1000;
// Tiempo que se muestra el resultado de cada escaneo antes de abrir la cámara para el siguiente
const PAUSA_EXITO_MS = 2200;
const PAUSA_ERROR_MS = 3500;

/**
 * Escáner de QR para dar puntos.
 *
 * Modo automático (autoEventoHoy + fetchEventosHoy): identifica el evento de hoy y, al escanear,
 * da sus puntos sin más pasos; muestra un check con el nombre y vuelve a abrir la cámara para la
 * siguiente persona. Si hoy no hay evento, o la persona prefiere dar puntos a mano, se usa el
 * flujo manual de siempre (elegir tipo de punto y, si hace falta, el evento).
 */
export default function QrScanner({
  role, readerId, types, theme, tiposConEvento, fetchEventosPorTipo, onEventoConfirmado,
  autoEventoHoy = false, fetchEventosHoy,
}) {
  const { user } = useAuth();
  const html5QrRef    = useRef(null);
  const escaneandoRef = useRef(false);

  const [escaneando, setEscaneando]          = useState(false);
  const [pendienteIniciar, setPendiente]     = useState(false);
  const [usuario, setUsuario]                = useState(null);
  const [loading, setLoading]                = useState(false);
  const [mensaje, setMensaje]                = useState(null);
  const [config, setConfig]                  = useState({});
  const [selectorEvento, setSelectorEvento]  = useState(null); // { tipo, label, eventos }
  const eventosCacheRef = useRef({});

  // ── Modo automático ──
  const [eventosHoy, setEventosHoy]     = useState(null);  // null = cargando · [] = ninguno
  const [eventoActivo, setEventoActivo] = useState(null);
  const [modoAuto, setModoAuto]         = useState(true);
  const [eligiendo, setEligiendo]       = useState(false); // lista para elegir entre varios eventos de hoy
  const [resultado, setResultado]       = useState(null);  // { ok, nombre, valor?, texto?, evento? }
  const reinicioRef    = useRef(null);
  const cargadoEnRef   = useRef(0);
  // El callback del escáner se crea al abrir la cámara: estas referencias le dan el estado más reciente
  const autoRef        = useRef({ activo: false, evento: null });

  const autoEfectivo = autoEventoHoy && modoAuto && !!eventoActivo;

  useEffect(() => {
    autoRef.current = { activo: autoEfectivo, evento: eventoActivo };
  });

  const cargarEventosHoy = useCallback(async () => {
    if (!autoEventoHoy || !fetchEventosHoy) return;
    try {
      const lista = await fetchEventosHoy();
      // Solo eventos cuyo tipo de puntos este escáner puede otorgar
      const candidatos = lista.filter((ev) => types.some((t) => t.key === ev.tipoPuntos));
      cargadoEnRef.current = Date.now();
      setEventosHoy(candidatos);
      setEventoActivo((prev) => {
        if (candidatos.length === 1) return candidatos[0];
        // Con varios eventos se conserva el elegido, si sigue siendo de hoy
        return candidatos.find((ev) => ev.id === prev?.id) ?? null;
      });
    } catch {
      setEventosHoy((prev) => prev ?? []);
      mostrarToast("No se pudieron cargar los eventos de hoy. Puedes dar puntos manualmente.");
    }
  }, [autoEventoHoy, fetchEventosHoy, types]);

  // Limpia la cámara si el componente se desmonta (cambio de tab, logout, etc.)
  useEffect(() => {
    getConfigPuntos().then(setConfig);
    cargarEventosHoy();
    return () => {
      clearTimeout(reinicioRef.current);
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
        try { html5QrRef.current.clear(); } catch { /* la cámara ya estaba detenida */ }
        html5QrRef.current = null;
      }
      resetContenedor(readerId);
    };
  }, [readerId, cargarEventosHoy]);

  // Escanea, otorga los puntos del evento activo y muestra el resultado
  const procesarAuto = async (data, evento) => {
    const nombre = `${data.name ?? ""} ${data.lastName ?? ""}`.trim() || "Participante";
    let exito = false;
    try {
      const valor = await otorgarPuntos({
        uidReceptor:    data.uid,
        uidOtorgante:   user.uid,
        rolOtorgante:   role,
        tipo:           evento.tipoPuntos,
        eventoId:       evento.id,
        eventoTitulo:   evento.titulo,
        nombreReceptor: nombre,
      });
      setResultado({ ok: true, nombre, valor, evento });
      exito = true;
      try { navigator.vibrate?.(80); } catch { /* no todos los dispositivos vibran */ }
      if (onEventoConfirmado) onEventoConfirmado(evento);
    } catch (err) {
      setResultado({ ok: false, nombre, texto: err.message || "No se pudieron dar los puntos." });
    }
    programarReinicio(exito ? PAUSA_EXITO_MS : PAUSA_ERROR_MS);
  };

  const programarReinicio = (ms) => {
    clearTimeout(reinicioRef.current);
    reinicioRef.current = setTimeout(() => {
      setResultado(null);
      iniciarScanner();
    }, ms);
  };

  useEffect(() => {
    if (!pendienteIniciar) return;
    setPendiente(false);

    const qr = new Html5Qrcode(readerId);
    html5QrRef.current = qr;

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      async (uid) => {
        // QR detectado: detener cámara y buscar usuario
        escaneandoRef.current = false;
        try { await qr.stop(); qr.clear(); } catch { /* la cámara ya estaba detenida */ }
        html5QrRef.current = null;
        resetContenedor(readerId);
        setEscaneando(false);
        setLoading(true);
        try {
          const data = await getUsuarioPorUID(uid);
          const auto = autoRef.current;
          if (data && auto.activo && auto.evento) {
            // Automático: se dan los puntos del evento de hoy sin pasos intermedios
            await procesarAuto(data, auto.evento);
          } else if (data) {
            setUsuario(data);
          } else if (auto.activo) {
            setResultado({ ok: false, nombre: "", texto: "Usuario no encontrado." });
            programarReinicio(PAUSA_ERROR_MS);
          } else {
            setMensaje({ text: "Usuario no encontrado.", type: "error" });
          }
        } catch {
          if (autoRef.current.activo) {
            setResultado({ ok: false, nombre: "", texto: "Error al buscar usuario." });
            programarReinicio(PAUSA_ERROR_MS);
          } else {
            setMensaje({ text: "Error al buscar usuario.", type: "error" });
          }
        } finally { setLoading(false); }
      },
      () => {}
    ).catch((err) => {
      // Error al iniciar la cámara
      escaneandoRef.current = false;
      html5QrRef.current = null;
      resetContenedor(readerId);
      setEscaneando(false);
      setMensaje({ text: errorCamara(err), type: "error" });
    });
    // procesarAuto y programarReinicio solo usan setters y referencias estables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendienteIniciar, readerId]);

  const detenerScanner = async () => {
    clearTimeout(reinicioRef.current);
    // Siempre intentar limpiar si hay una instancia activa,
    // sin depender de escaneandoRef (evita condición de carrera)
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
        html5QrRef.current = null;
      }
    } catch { /* la cámara ya estaba detenida */ }
    resetContenedor(readerId);
    escaneandoRef.current = false;
    setEscaneando(false);
  };

  const iniciarScanner = async () => {
    setUsuario(null);
    setMensaje(null);
    // Si la lista de eventos de hoy está vieja (por ejemplo, la app quedó abierta de un día para otro) se refresca
    if (autoEventoHoy && Date.now() - cargadoEnRef.current > VIGENCIA_EVENTOS_MS) {
      await cargarEventosHoy();
    }
    setEscaneando(true);
    escaneandoRef.current = true;
    setPendiente(true);
  };

  // Detiene la secuencia automática (por ejemplo, para cambiar de evento o pasar a modo manual)
  const cancelarSecuencia = () => {
    clearTimeout(reinicioRef.current);
    setResultado(null);
  };

  const darPunto = async (tipo, evento = null) => {
    if (!usuario) return;
    setLoading(true);
    setMensaje(null);
    try {
      const valor = await otorgarPuntos({
        uidReceptor:    usuario.uid,
        uidOtorgante:   user.uid,
        rolOtorgante:   role,
        tipo,
        eventoId:       evento?.id ?? null,
        eventoTitulo:   evento?.titulo ?? null,
        nombreReceptor: `${usuario.name ?? ""} ${usuario.lastName ?? ""}`.trim(),
      });
      const sufijo = evento ? ` · ${evento.titulo}` : "";
      setMensaje({
        text: `+${valor} punto${valor > 1 ? "s" : ""} otorgado${valor > 1 ? "s" : ""} ✓${sufijo}`,
        type: "success",
      });
      setUsuario((prev) => ({ ...prev, puntos: (prev.puntos ?? 0) + valor }));
      if (evento && onEventoConfirmado) onEventoConfirmado(evento);
    } catch (err) {
      setMensaje({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTipoClick = async (tipo) => {
    if (tiposConEvento?.includes(tipo) && fetchEventosPorTipo) {
      const label = types.find((t) => t.key === tipo)?.label ?? tipo;
      if (eventosCacheRef.current[tipo]) {
        setSelectorEvento({ tipo, label, eventos: eventosCacheRef.current[tipo] });
        return;
      }
      setLoading(true);
      setMensaje(null);
      try {
        const eventos = await fetchEventosPorTipo(tipo);
        eventosCacheRef.current[tipo] = eventos;
        setSelectorEvento({ tipo, label, eventos });
      } catch {
        setMensaje({ text: "Error al cargar eventos. Intenta de nuevo.", type: "error" });
      } finally {
        setLoading(false);
      }
    } else {
      darPunto(tipo);
    }
  };

  const etiquetaTipo = (key) => types.find((t) => t.key === key)?.label ?? key;
  const puntosDe = (ev) => config?.[ev.tipoPuntos];
  const hayCandidatos = (eventosHoy?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">

      {/* ── Evento de hoy (modo automático) ── */}
      {autoEventoHoy && !resultado && !usuario && (
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          {eventosHoy === null ? (
            <p className="text-center text-sm text-slate-400">Buscando el evento de hoy…</p>
          ) : !hayCandidatos ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">Hoy no hay eventos con puntos</p>
              <p className="mt-0.5 text-xs text-slate-400">Escanea y elige los puntos manualmente.</p>
            </div>
          ) : !modoAuto ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-600">Modo manual</p>
                <p className="text-xs text-slate-400">Eliges los puntos en cada escaneo.</p>
              </div>
              <button
                onClick={() => setModoAuto(true)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${theme.valueText} bg-slate-50 transition hover:bg-slate-100`}
              >
                Volver al automático
              </button>
            </div>
          ) : eventoActivo && !eligiendo ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Evento de hoy · automático</p>
              <p className="mt-1 break-words text-base font-bold leading-snug text-slate-800">{eventoActivo.titulo}</p>
              <p className="mt-0.5 break-words text-xs text-slate-500">
                {eventoActivo.hora ? `🕒 ${eventoActivo.hora}` : ""}
                {eventoActivo.hora && eventoActivo.lugar ? " · " : ""}
                {eventoActivo.lugar ? `📍 ${eventoActivo.lugar}` : ""}
              </p>
              <p className={`mt-1.5 text-xs font-bold ${theme.valueText}`}>
                {etiquetaTipo(eventoActivo.tipoPuntos)}
                {puntosDe(eventoActivo) != null ? ` · +${puntosDe(eventoActivo)} pt${puntosDe(eventoActivo) > 1 ? "s" : ""}` : ""}
              </p>
              <div className="mt-3 flex gap-2">
                {eventosHoy.length > 1 && (
                  <button
                    onClick={() => setEligiendo(true)}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                  >
                    Cambiar evento
                  </button>
                )}
                <button
                  onClick={() => setModoAuto(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Dar puntos manualmente
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-700">Hoy hay varios eventos. ¿Cuál estás registrando?</p>
              <div className="mt-3 flex flex-col gap-2">
                {eventosHoy.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => { setEventoActivo(ev); setEligiendo(false); }}
                    className={`flex flex-col items-start rounded-2xl border bg-slate-50 px-4 py-3 text-left transition ${theme.rowHover} ${
                      ev.id === eventoActivo?.id ? "border-slate-400" : "border-slate-200"
                    }`}
                  >
                    <span className="break-words text-sm font-semibold text-slate-800">{ev.titulo}</span>
                    <span className="mt-0.5 text-xs text-slate-400">
                      {ev.hora ? `🕒 ${ev.hora} · ` : ""}{etiquetaTipo(ev.tipoPuntos)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div id={readerId} className={escaneando ? "block" : "hidden"} />

        {!escaneando && !usuario && !resultado && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${theme.iconBg} text-4xl`}>
              📷
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Escanear código QR</p>
              <p className="mt-1 text-sm text-slate-400">Apunta al QR del participante</p>
            </div>
            <button
              onClick={iniciarScanner}
              className="rounded-2xl px-8 py-3 text-sm font-bold text-white transition active:scale-95"
              style={{ background: theme.btnGradient }}
            >
              Abrir cámara
            </button>
          </div>
        )}

        {escaneando && (
          <div className="flex justify-center pt-3 pb-2">
            <button onClick={detenerScanner} className="text-sm font-medium text-red-500">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div
            className={`h-8 w-8 rounded-full border-4 ${theme.spinnerBorder}`}
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
      )}

      {/* ── Resultado del escaneo automático ── */}
      {resultado && !loading && (
        <div
          role="status"
          className={`flex flex-col items-center gap-3 rounded-3xl border px-5 py-8 text-center shadow-sm ${
            resultado.ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full text-white ${
              resultado.ok ? "bg-emerald-500" : "bg-amber-500"
            }`}
          >
            {resultado.ok ? (
              <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v4.5m0 3.75h.008v.008H12V16.5z" />
              </svg>
            )}
          </div>

          {resultado.nombre && (
            <p className="break-words text-xl font-bold leading-tight text-slate-800">{resultado.nombre}</p>
          )}
          {resultado.ok ? (
            <p className="text-sm font-semibold text-emerald-700">
              +{resultado.valor} punto{resultado.valor > 1 ? "s" : ""} · {resultado.evento.titulo}
            </p>
          ) : (
            <p className="text-sm font-semibold text-amber-700">{resultado.texto}</p>
          )}

          <p className="text-xs text-slate-400">Abriendo la cámara para el siguiente…</p>
          <button
            onClick={cancelarSecuencia}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            Detener
          </button>
        </div>
      )}

      {mensaje && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold text-center ${
          mensaje.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {mensaje.text}
        </div>
      )}

      {usuario && !loading && (
        <div className="rounded-3xl bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.avatarBg} text-lg font-bold ${theme.avatarText}`}>
              {usuario.name?.[0]}{usuario.lastName?.[0]}
            </div>
            <div>
              <p className="font-bold text-slate-800">{usuario.name} {usuario.lastName}</p>
              <p className="text-xs text-slate-400">{usuario.codigoJAS} · ⭐ {usuario.puntos ?? 0} pts</p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Otorgar puntos</p>
          <div className="flex flex-col gap-2">
            {types.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTipoClick(t.key)}
                disabled={loading}
                className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition ${theme.rowHover} disabled:opacity-50`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>{t.emoji}</span>{t.label}
                </span>
                <span className={`text-xs font-bold ${theme.valueText}`}>
                  +{config?.[t.key] ?? "..."} pt{config?.[t.key] > 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setUsuario(null); setMensaje(null); setSelectorEvento(null); }}
            className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            Escanear otro
          </button>
        </div>
      )}

      {selectorEvento && (
        <div className="rounded-3xl bg-white p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">¿Para qué evento?</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">{selectorEvento.label}</p>
            </div>
            <button
              onClick={() => setSelectorEvento(null)}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          {selectorEvento.eventos.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              No hay eventos con este tipo de puntos
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {selectorEvento.eventos.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectorEvento(null);
                    darPunto(selectorEvento.tipo, ev);
                  }}
                  className={`flex flex-col items-start rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition ${theme.rowHover}`}
                >
                  <p className="text-sm font-semibold text-slate-800">{ev.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    🗓 {formatearFechaIso(ev.fecha)}{ev.hora ? ` · ${ev.hora}` : ""}{ev.lugar ? ` · 📍 ${ev.lugar}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
