import QrScanner from "../../../components/shared/QrScanner";
import { getEventosPorTipo } from "../../../services/adminService";

const TIPOS = [
  { key: "actividadPequena", label: "Actividad Pequeña", emoji: "🎯" },
  { key: "actividadGrande",  label: "Actividad Grande",  emoji: "🏆" },
];

const THEME = {
  iconBg:        "bg-cyan-50",
  avatarBg:      "bg-cyan-100",
  avatarText:    "text-cyan-700",
  spinnerBorder: "border-cyan-100 border-t-cyan-700",
  rowHover:      "hover:bg-cyan-50 hover:border-cyan-300",
  valueText:     "text-cyan-700",
  btnGradient:   "linear-gradient(135deg, #155e75, #0e7490)",
};

export default function EscanearQRBienvenida() {
  return (
    <QrScanner
      role="bienvenida"
      readerId="qr-reader-bienvenida"
      types={TIPOS}
      theme={THEME}
      tiposConEvento={["actividadPequena", "actividadGrande"]}
      fetchEventosPorTipo={getEventosPorTipo}
    />
  );
}
