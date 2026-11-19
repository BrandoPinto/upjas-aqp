import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import PortalSwitcher from "./PortalSwitcher";

export default function PortalLayout({
  gradient, subtitleText, subtitleColor, accentColor,
  tabs, activeTab, onTabChange, children,
}) {
  const { profile } = useAuth();
  const navigate    = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">

      <div className="sticky top-0 z-20 px-4 pt-5 pb-4" style={{ background: gradient }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${subtitleColor}`}>
              {subtitleText}
            </p>
            <h1 className="text-lg font-bold text-white">
              {profile?.name} {profile?.lastName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <PortalSwitcher />
            <button
              onClick={handleLogout}
              className="rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-md">{children}</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
                style={{ color: active ? accentColor : "#94a3b8" }}
              >
                {tab.icon(active)}
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
