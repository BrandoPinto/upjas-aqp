import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../../context/AuthContext";
import EditProfileModal from "./EditProfileModal";
import PrivacidadModal from "./PrivacidadModal";

export default function MiPase({ onLogout }) {
  const { profile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showPrivacidad, setShowPrivacidad] = useState(false);
  const [shareMsg, setShareMsg] = useState(null);

  const ubicacion =
    profile?.relation === "miembro" && profile?.stateValue
      ? `${profile.stateValue} · ${profile.parish ?? ""}`
      : "No Aplica";

  const handleShare = async () => {
    const shareData = {
      title: "UP JAS AQP",
      text: "Únete a UP JAS AQP. Gestiona tus clases, eventos y pase digital.",
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareMsg("¡Enlace copiado al portapapeles!");
        setTimeout(() => setShareMsg(null), 3000);
      }
    } catch {
      // El usuario canceló el share — no se hace nada
    }
  };

  return (
    <div className="flex flex-col items-center px-4 pt-6 gap-5">

      {/* QR Card */}
      <div className="w-full rounded-3xl bg-white p-6 shadow-sm flex flex-col items-center gap-3">
        {/* Fondo blanco y color-scheme claro fijos: el modo oscuro del dispositivo
            no debe alterar el QR, porque los escáneres no lo leen sobre fondo oscuro */}
        <div
          className="rounded-2xl p-3 shadow-inner border border-slate-100"
          style={{ background: "#ffffff", colorScheme: "light" }}
        >
          <QRCodeSVG
            value={profile?.uid ?? "sin-uid"}
            size={200}
            level="H"
            marginSize={0}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <p className="text-xs text-slate-400">Muestra este código en recepción</p>
      </div>

      {/* Ubicación */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="capitalize">{ubicacion}</span>
      </div>

      {/* Mensaje de copia */}
      {shareMsg && (
        <p className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">{shareMsg}</p>
      )}

      {/* Acciones */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          COMPARTIR APP
        </button>

        <button
          onClick={() => setShowEdit(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          EDITAR MIS DATOS
        </button>

        {/* Pie: acciones secundarias, separadas de los botones principales */}
        <div className="mt-4 flex flex-col items-center gap-0.5 border-t border-white/10 pt-4">
          <button
            onClick={() => setShowPrivacidad(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[rgba(240,244,248,0.55)] transition hover:text-[#f0f4f8]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Privacidad y mis datos
          </button>

          <button
            onClick={onLogout}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition hover:text-red-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Modal de edición */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Privacidad y derechos ARCO */}
      {showPrivacidad && (
        <PrivacidadModal
          onCerrar={() => setShowPrivacidad(false)}
          onEditar={() => { setShowPrivacidad(false); setShowEdit(true); }}
        />
      )}

    </div>
  );
}
