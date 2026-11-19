import QrScanner from "../../../components/shared/QrScanner";

const TIPOS = [
  { key: "asistencia", label: "Asistencia Instituto", emoji: "📚" },
  { key: "invitacion", label: "Invitación a amigo",   emoji: "🤝" },
];

const THEME = {
  iconBg:        "bg-emerald-50",
  avatarBg:      "bg-blue-100",
  avatarText:    "text-blue-700",
  spinnerBorder: "border-emerald-100 border-t-emerald-600",
  rowHover:      "hover:bg-emerald-50 hover:border-emerald-300",
  valueText:     "text-emerald-600",
  btnGradient:   "linear-gradient(135deg, #064e3b, #065f46)",
};

export default function EscanearQR() {
  return <QrScanner role="maestro" readerId="qr-reader-maestro" types={TIPOS} theme={THEME} />;
}
