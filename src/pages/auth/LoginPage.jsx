import { useAuthForm } from "../../hooks/useAuthForm";
import PanelLogin from "../../components/auth/PanelLogin";
import PanelRegister from "../../components/auth/PanelRegister";
import OverlayToggle from "../../components/auth/OverlayToggle";

export default function LoginPage() {
  const form = useAuthForm();

  return (
    <>
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0"
        style={{ background: "var(--bg-base)" }}
      />

      {/* Toast — fijo abajo, centrado, responsive */}
      {form.toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-sm rounded-2xl border px-5 py-3.5 text-center text-sm font-semibold shadow-2xl"
          style={{
            ...form.toastStyle,
            animation: "toastIn .3s ease both",
          }}
        >
          {form.toast.msg}
        </div>
      )}

      {/* Contenedor principal */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div
          className={`
            relative flex w-full max-w-[820px] flex-col rounded-[28px] shadow-2xl md:flex-row
            md:overflow-hidden md:transition-[height] md:duration-700 md:ease-in-out
            ${form.isRegister
              ? "md:h-[min(680px,calc(100vh-32px))]"
              : "md:h-[min(580px,calc(100vh-32px))]"
            }
          `}
          style={{
            background: "var(--bg-surface)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.50)",
          }}
        >
          {/* Borde decorativo */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/[0.08]"
            style={{ zIndex: 10 }}
          />

          <PanelLogin
            isRegister={form.isRegister}
            subView={form.subView}
            setSubView={form.setSubView}
            email={form.email}
            setEmail={form.setEmail}
            password={form.password}
            setPassword={form.setPassword}
            showPw={form.showPw}
            setShowPw={form.setShowPw}
            errors={form.errors}
            setErrors={form.setErrors}
            loading={form.loading}
            handleLogin={form.handleLogin}
            handleReset={form.handleReset}
            resetForms={form.resetForms}
          />

          <PanelRegister
            isRegister={form.isRegister}
            name={form.name}
            setName={form.setName}
            lastName={form.lastName}
            setLastName={form.setLastName}
            email={form.email}
            setEmail={form.setEmail}
            password={form.password}
            setPassword={form.setPassword}
            phone={form.phone}
            setPhone={form.setPhone}
            birthDate={form.birthDate}
            setBirthDate={form.setBirthDate}
            gender={form.gender}
            setGender={form.setGender}
            relation={form.relation}
            setRelation={form.setRelation}
            stateValue={form.stateValue}
            setStateValue={form.setStateValue}
            parish={form.parish}
            setParish={form.setParish}
            termsAccepted={form.termsAccepted}
            setTermsAccepted={form.setTermsAccepted}
            showPw={form.showPw}
            setShowPw={form.setShowPw}
            errors={form.errors}
            loading={form.loading}
            handleRegister={form.handleRegister}
          />

          <OverlayToggle isRegister={form.isRegister} onSwitch={form.switchPanel} />
        </div>
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) translateX(-50%); }
          to   { opacity: 1; transform: translateY(0)    translateX(-50%); }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #132338 inset !important;
          -webkit-text-fill-color: #f0f4f8 !important;
        }
      `}</style>
    </>
  );
}
