import PortalLayout from "../../components/shared/PortalLayout";
import EscanearQRLider from "./tabs/EscanearQRLider";

const tabs = [
  {
    key: "escanear",
    label: "Escanear",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
];

// El líder es el comité de bienvenida: solo registra asistencia con el escáner QR.
// No tiene acceso a clases ni a eventos (crear, editar o eliminar).
export default function LiderDashboard() {
  return (
    <PortalLayout
      gradient="linear-gradient(135deg, #4c1d95, #6d28d9)"
      subtitleText="Portal Líder"
      subtitleColor="text-violet-300"
      accentColor="#6d28d9"
      tabs={tabs}
      activeTab="escanear"
      onTabChange={() => {}}
    >
      <EscanearQRLider />
    </PortalLayout>
  );
}
