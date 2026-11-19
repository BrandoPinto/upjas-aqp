import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import LegalModal from "../../../components/shared/LegalModal";
import {
  exportarMisDatos, eliminarMiCuenta, crearSolicitudARCO, TIPOS_SOLICITUD,
} from "../../../services/privacidadService";

const ERRORES_ELIMINAR = {
  "auth/wrong-password":     "Contraseña incorrecta.",
  "auth/invalid-credential": "Contraseña incorrecta.",
  "auth/too-many-requests":  "Demasiados intentos. Espera un momento.",
  "auth/requires-recent-login": "Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo.",
};

export default function PrivacidadModal({ onCerrar, onEditar }) {
  const { profile } = useAuth();

  const [leyendo, setLeyendo]           = useState(null);
  const [descargando, setDescargando]   = useState(false);
  const [aviso, setAviso]               = useState(null); // { text, type }

  const [tipo, setTipo]                 = useState(TIPOS_SOLICITUD[0].key);
  const [detalle, setDetalle]           = useState("");
  const [enviando, setEnviando]         = useState(false);

  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [password, setPassword]         = useState("");
  const [eliminando, setEliminando]     = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  // ACCESO: descarga un archivo con todos los datos de la persona
  const descargar = async () => {
    setDescargando(true);
    setAviso(null);
    try {
      const datos = await exportarMisDatos(profile.uid);
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-upjas-${profile.codigoJAS ?? profile.uid}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setAviso({ text: "Descargaste una copia de tus datos.", type: "ok" });
    } catch {
      setAviso({ text: "No se pudo generar la descarga. Intenta de nuevo.", type: "error" });
    } finally {
      setDescargando(false);
    }
  };

  // OPOSICIÓN / otras solicitudes: llegan a los administradores
  const enviarSolicitud = async () => {
    if (detalle.trim().length < 10) {
      setAviso({ text: "Cuéntanos un poco más (mínimo 10 caracteres).", type: "error" });
      return;
    }
    setEnviando(true);
    setAviso(null);
    try {
      await crearSolicitudARCO({ tipo, detalle, perfil: profile });
      setDetalle("");
      setAviso({ text: "Recibimos tu solicitud. Los organizadores la revisarán.", type: "ok" });
    } catch {
      setAviso({ text: "No se pudo enviar tu solicitud. Intenta de nuevo.", type: "error" });
    } finally {
      setEnviando(false);
    }
  };

  // CANCELACIÓN: borra la cuenta y sus datos
  const eliminar = async () => {
    if (!password) { setErrorEliminar("Escribe tu contraseña para confirmar."); return; }
    setEliminando(true);
    setErrorEliminar("");
    try {
      await eliminarMiCuenta(password);
      // La sesión se cierra sola y el router lleva al login
    } catch (err) {
      setErrorEliminar(ERRORES_ELIMINAR[err?.code] ?? "No se pudo eliminar la cuenta. Intenta de nuevo.");
      setEliminando(false);
    }
  };

  const titulo = "mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400";
  const boton  = "flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onCerrar}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white px-5 pt-5 pb-8 shadow-2xl"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
        <h2 className="mb-1 text-center text-base font-bold text-slate-700">Privacidad y mis datos</h2>
        <p className="mb-5 text-center text-xs leading-relaxed text-slate-400">
          Aquí puedes ejercer tus derechos sobre tus datos personales (Ley N° 29733).
        </p>

        {aviso && (
          <p className={`mb-4 rounded-xl px-3 py-2 text-center text-sm font-semibold ${
            aviso.type === "ok" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          }`}>
            {aviso.text}
          </p>
        )}

        <div className="flex flex-col gap-5">

          {/* Acceso y rectificación */}
          <section>
            <p className={titulo}>Ver y corregir mis datos</p>
            <div className="flex flex-col gap-2">
              <button onClick={descargar} disabled={descargando} className={boton}>
                <span>
                  Descargar una copia de mis datos
                  <span className="block text-xs font-normal text-slate-400">Acceso · archivo con tu perfil, puntos y asistencias</span>
                </span>
                {descargando
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
                  : <span aria-hidden="true">⬇</span>}
              </button>
              <button onClick={onEditar} className={boton}>
                <span>
                  Corregir mis datos
                  <span className="block text-xs font-normal text-slate-400">Rectificación · editar nombre, celular, etc.</span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </section>

          {/* Oposición y otras solicitudes */}
          <section>
            <p className={titulo}>Enviar una solicitud a los organizadores</p>
            <div className="flex flex-col gap-2">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
              >
                {TIPOS_SOLICITUD.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Cuéntanos qué necesitas"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
              />
              <button
                onClick={enviarSolicitud}
                disabled={enviando}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </section>

          {/* Documentos */}
          <section>
            <p className={titulo}>Documentos</p>
            <div className="flex flex-col gap-2">
              {[
                ["privacidad", "Política de Privacidad"],
                ["terminos", "Términos y Condiciones"],
                ["datos", "Autorización de tratamiento de datos"],
              ].map(([k, label]) => (
                <button key={k} onClick={() => setLeyendo(k)} className={boton}>
                  {label}<span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </section>

          {/* Cancelación */}
          <section>
            <p className={titulo}>Eliminar mi cuenta</p>
            {!confirmandoBorrado ? (
              <button
                onClick={() => setConfirmandoBorrado(true)}
                className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                Quiero eliminar mi cuenta
                <span className="block text-xs font-normal text-red-400">Cancelación · se borran tus datos</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs leading-relaxed text-red-600">
                  Se borrarán tu perfil, tus puntos, tu historial, tus asistencias y tus inscripciones.
                  <strong> Esta acción no se puede deshacer.</strong> Para confirmar, escribe tu contraseña.
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorEliminar(""); }}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-red-400"
                />
                {errorEliminar && <p className="text-xs font-semibold text-red-600">{errorEliminar}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setConfirmandoBorrado(false); setPassword(""); setErrorEliminar(""); }}
                    disabled={eliminando}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={eliminar}
                    disabled={eliminando}
                    className="flex-1 rounded-2xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {eliminando ? "Eliminando..." : "Eliminar definitivamente"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <button
          onClick={onCerrar}
          className="mt-5 w-full py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
        >
          Cerrar
        </button>
      </div>

      {leyendo && <LegalModal k={leyendo} onCerrar={() => setLeyendo(null)} />}
    </div>
  );
}
