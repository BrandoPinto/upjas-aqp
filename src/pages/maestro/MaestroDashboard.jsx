import { useState } from "react";
import PortalLayout from "../../components/shared/PortalLayout";
import EscanearQR from "./tabs/EscanearQR";
import MiClase from "./tabs/MiClase";

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
  {
    key: "clase",
    label: "Mi Clase",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function MaestroDashboard() {
  const [activeTab, setActiveTab] = useState("escanear");

  return (
    <PortalLayout
      gradient="linear-gradient(135deg, #064e3b, #065f46)"
      subtitleText="Portal Maestro"
      subtitleColor="text-emerald-300"
      accentColor="#065f46"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "escanear" && <EscanearQR />}
      {activeTab === "clase"    && <MiClase />}
    </PortalLayout>
  );
}
