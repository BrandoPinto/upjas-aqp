import PortalLayout from "../../components/shared/PortalLayout";
import EscanearQRBienvenida from "./tabs/EscanearQRBienvenida";

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

// Portal del comité de bienvenida: solo registra asistencia con el escáner QR.
// No tiene acceso a clases, eventos ni a ninguna función de administración.
export default function BienvenidaDashboard() {
  return (
    <PortalLayout
      gradient="linear-gradient(135deg, #155e75, #0e7490)"
      subtitleText="Comité de Bienvenida"
      subtitleColor="text-cyan-200"
      accentColor="#0e7490"
      tabs={tabs}
      activeTab="escanear"
      onTabChange={() => {}}
    >
      <EscanearQRBienvenida />
    </PortalLayout>
  );
}
