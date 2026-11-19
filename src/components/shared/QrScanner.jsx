import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../../context/AuthContext";
import { getUsuarioPorUID, otorgarPuntos, getConfigPuntos } from "../../services/puntosService";

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

export default function QrScanner({ role, readerId, types, theme, tiposConEvento, fetchEventosPorTipo, onEventoConfirmado }) {
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

  // Limpia la cámara si el componente se desmonta (cambio de tab, logout, etc.)
  useEffect(() => {
    getConfigPuntos().then(setConfig);
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
        try { html5QrRef.current.clear(); } catch (_) {}
        html5QrRef.current = null;
      }
      resetContenedor(readerId);
    };
  }, [readerId]);

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
        try { await qr.stop(); qr.clear(); } catch (_) {}
        html5QrRef.current = null;
        resetContenedor(readerId);
        setEscaneando(false);
        setLoading(true);
        try {
          const data = await getUsuarioPorUID(uid);
          if (data) setUsuario(data);
          else setMensaje({ text: "Usuario no encontrado.", type: "error" });
        } catch {
          setMensaje({ text: "Error al buscar usuario.", type: "error" });
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
  }, [pendienteIniciar, readerId]);

  const detenerScanner = async () => {
    // Siempre intentar limpiar si hay una instancia activa,
    // sin depender de escaneandoRef (evita condición de carrera)
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
        html5QrRef.current = null;
      }
    } catch (_) {}
    resetContenedor(readerId);
    escaneandoRef.current = false;
    setEscaneando(false);
  };

  const iniciarScanner = () => {
    setUsuario(null);
    setMensaje(null);
    setEscaneando(true);
    escaneandoRef.current = true;
    setPendiente(true);
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

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div id={readerId} className={escaneando ? "block" : "hidden"} />

        {!escaneando && !usuario && (
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
                    🗓 {ev.fecha}{ev.hora ? ` · ${ev.hora}` : ""}{ev.lugar ? ` · 📍 ${ev.lugar}` : ""}
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
