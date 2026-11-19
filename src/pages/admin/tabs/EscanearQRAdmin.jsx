import { useState } from "react";
import QrScanner from "../../../components/shared/QrScanner";
import ModalAsistenciaEvento from "../../../components/shared/ModalAsistenciaEvento";
import { getEventosPorTipo } from "../../../services/adminService";
import { TIPOS_PUNTOS, TIPOS_CON_EVENTO } from "../../../constants/puntos";

const THEME = {
  iconBg:        "bg-red-50",
  avatarBg:      "bg-red-100",
  avatarText:    "text-red-700",
  spinnerBorder: "border-red-100 border-t-red-700",
  rowHover:      "hover:bg-red-50 hover:border-red-300",
  valueText:     "text-red-700",
  btnGradient:   "linear-gradient(135deg, #7f1d1d, #991b1b)",
};

export default function EscanearQRAdmin() {
  const [eventoActivo, setEventoActivo] = useState(null);
  const [verReporte, setVerReporte]     = useState(false);

  return (
    <>
      <QrScanner
        role="admin"
        readerId="qr-reader-admin"
        types={TIPOS_PUNTOS}
        theme={THEME}
        tiposConEvento={TIPOS_CON_EVENTO}
        fetchEventosPorTipo={getEventosPorTipo}
        onEventoConfirmado={setEventoActivo}
      />

      {eventoActivo && (
        <div className="px-4 pb-6">
          <button
            onClick={() => setVerReporte(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 shadow-sm"
          >
            <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Reporte de asistencia</span>
            <span className="ml-1 max-w-[160px] truncate text-xs font-normal text-slate-400">· {eventoActivo.titulo}</span>
          </button>
        </div>
      )}

      {verReporte && eventoActivo && (
        <ModalAsistenciaEvento evento={eventoActivo} onCerrar={() => setVerReporte(false)} />
      )}
    </>
  );
}
