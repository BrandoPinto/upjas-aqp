import { useState } from "react";
import QrScanner from "../../../components/shared/QrScanner";
import { getEventosPorTipo } from "../../../services/adminService";

const TIPOS = [
  { key: "actividadPequena", label: "Actividad Pequeña", emoji: "🎯" },
  { key: "actividadGrande",  label: "Actividad Grande",  emoji: "🏆" },
  { key: "plus",             label: "Plus",              emoji: "⭐" },
];

const THEME = {
  iconBg:        "bg-violet-50",
  avatarBg:      "bg-violet-100",
  avatarText:    "text-violet-700",
  spinnerBorder: "border-violet-100 border-t-violet-600",
  rowHover:      "hover:bg-violet-50 hover:border-violet-300",
  valueText:     "text-violet-600",
  btnGradient:   "linear-gradient(135deg, #4c1d95, #6d28d9)",
};

export default function EscanearQRLider() {
  const [, setEventoActivo] = useState(null);

  return (
    <QrScanner
      role="lider"
      readerId="qr-reader-lider"
      types={TIPOS}
      theme={THEME}
      tiposConEvento={["actividadGrande", "actividadPequena"]}
      fetchEventosPorTipo={getEventosPorTipo}
      onEventoConfirmado={setEventoActivo}
    />
  );
}
