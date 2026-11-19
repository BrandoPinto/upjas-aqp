import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import PortalSwitcher from "../../components/shared/PortalSwitcher";
import ErrorBoundary from "../../components/shared/ErrorBoundary";
import MiPase from "./tabs/MiPase";
import Clases from "./tabs/Clases";
import Eventos from "./tabs/Eventos";
import HistorialPuntos from "./tabs/HistorialPuntos";

const tabs = [
  {
    key: "pase",
    label: "Mi Pase",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 14h3v3m0 4h4v-4m-4 0h4" />
      </svg>
    ),
  },
  {
    key: "clases",
    label: "Clases",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13.5c0 3-4.03 5.5-9 5.5S3 16.5 3 13.5c0-.538.09-1.06.255-1.556L12 14z" />
      </svg>
    ),
  },
  {
    key: "eventos",
    label: "Eventos",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pase");

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg-base)" }}>

      {/* Header fijo */}
      <div
        className="sticky top-0 z-20 px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4"
        style={{
          background: "linear-gradient(135deg, #1a4270, #2d69a3)",
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          {/* min-w-0 permite que el saludo se ajuste (hasta 2 líneas) en vez de chocar con los botones */}
          <div className="min-w-0">
            <h1 className="break-words text-lg font-bold leading-tight text-[#f0f4f8]">
              ¡Hola, {profile?.name} {profile?.lastName}!
            </h1>
            <p className="mt-0.5 text-sm text-[rgba(240,244,248,0.55)]">{profile?.codigoJAS}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PortalSwitcher />
            <button
              onClick={() => setActiveTab("historial")}
              className="flex items-center gap-1.5 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
            >
              <span className="text-base">⭐</span>
              <span className="text-sm font-bold text-white">{profile?.puntos ?? 0}</span>
              <svg className="h-3.5 w-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md">
          <ErrorBoundary resetKey={activeTab}>
            {activeTab === "pase"      && <MiPase onLogout={handleLogout} />}
            {activeTab === "clases"    && <Clases />}
            {activeTab === "eventos"   && <Eventos />}
            {activeTab === "historial" && <HistorialPuntos uid={profile?.uid} puntos={profile?.puntos} />}
          </ErrorBoundary>
        </div>
      </div>

      {/* Bottom Nav */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 pb-[env(safe-area-inset-bottom)]"
        style={{
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-default)",
        }}
      >
        <div className="mx-auto flex max-w-md">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
                style={{
                  color: active ? "#54aeb6" : "rgba(240,244,248,0.30)",
                }}
              >
                {tab.icon(active)}
                <span className="text-[11px] font-medium">{tab.label}</span>
                {active && (
                  <span
                    className="absolute bottom-1.5 h-1 w-1 rounded-full"
                    style={{ background: "#54aeb6" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
