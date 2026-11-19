import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import BackButton from "./BackButton";
import logoUpjas from "../../assets/logo-upjas.png";
import { Ic } from "../../constants/authIcons";
import { useEffect, useState } from "react";
import { resetPassword, getPistaCorreo, getUltimoCorreo } from "../../services/authService";

export default function PanelLogin({
  isRegister,
  subView, setSubView,
  email, setEmail,
  password, setPassword,
  showPw, setShowPw,
  errors, setErrors,
  loading,
  handleLogin,
  handleReset,
  resetForms,
}) {
  // Ayuda para recordar con qué correo se registró (búsqueda por celular)
  const [pistaAbierta, setPistaAbierta] = useState(false);
  const [pistaPhone, setPistaPhone]     = useState("");
  const [pista, setPista]               = useState(null); // null | { hint } | { noEncontrada: true }
  const [pistaLoading, setPistaLoading] = useState(false);
  const [pistaError, setPistaError]     = useState("");

  const abrirReset = () => {
    // Conserva el correo escrito (o el último usado en este dispositivo)
    const previo = email || getUltimoCorreo();
    resetForms();
    setEmail(previo);
    setPistaAbierta(false);
    setPistaPhone("");
    setPista(null);
    setPistaError("");
    setSubView("reset");
  };

  const buscarPista = async () => {
    if (!/^\d{9}$/.test(pistaPhone)) {
      setPistaError("Ingresa los 9 dígitos de tu celular.");
      return;
    }
    setPistaLoading(true);
    setPistaError("");
    setPista(null);
    try {
      const hint = await getPistaCorreo(pistaPhone);
      setPista(hint ? { hint } : { noEncontrada: true });
    } catch {
      setPistaError("No se pudo consultar. Intenta de nuevo.");
    } finally {
      setPistaLoading(false);
    }
  };

  const [countdown, setCountdown]       = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone]       = useState(false);

  useEffect(() => {
    if (subView === "success") { setCountdown(60); setResendDone(false); }
  }, [subView]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || resendLoading || !email) return;
    setResendLoading(true);
    setResendDone(false);
    try {
      await resetPassword(email);
      setCountdown(60);
      setResendDone(true);
      setTimeout(() => setResendDone(false), 3500);
    } catch { /* silencioso */ } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className={`
        relative z-[1] flex min-h-0 w-full flex-col items-center justify-center
        px-6 sm:px-10
        transition-[transform,opacity,max-height,padding] duration-700 ease-in-out
        md:absolute md:inset-0 md:w-1/2 md:left-0 md:right-auto
        md:overflow-y-auto md:rounded-l-[28px]
        ${isRegister
          ? "max-h-0 py-0 opacity-0 -translate-y-3 pointer-events-none overflow-hidden md:max-h-none md:translate-x-full md:translate-y-0 md:opacity-0 md:pointer-events-none"
          : "max-h-[2000px] py-8 opacity-100 translate-y-0 pointer-events-auto md:translate-x-0 md:opacity-100 md:pointer-events-auto"
        }
      `}
      style={{ background: "var(--bg-surface)" }}
    >

      {/* ── LOGIN NORMAL ── */}
      {subView === "main" && (
        <div className="flex w-full max-w-[320px] flex-col items-center pb-2">
          <div className="mb-5"><img src={logoUpjas} alt="UPJAS" className="h-28 w-auto" /></div>
          <h1
            className="mb-0.5 text-2xl font-bold text-[#f0f4f8]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            UpJAS AQP
          </h1>
          <p className="mb-6 text-sm text-[rgba(240,244,248,0.55)]">Inicie Sesión</p>

          <div className="flex w-full flex-col gap-3">
            <Field
              id="l-em" label="Correo electrónico" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              icon={Ic.mail} error={errors.email} autoComplete="email" dark
            />
            <Field
              id="l-pw" label="Contraseña" type={showPw ? "text" : "password"} value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              icon={Ic.lock} error={errors.password} autoComplete="current-password" dark
              right={
                <button type="button" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? Ic.eyeOff : Ic.eyeOn}
                </button>
              }
            />

            <div className="-mt-1 flex justify-end">
              <button
                type="button"
                onClick={abrirReset}
                className="flex items-center gap-1 text-xs font-medium text-[#df7e30] transition-colors hover:text-[#f09040]"
              >
                {Ic.key} ¿Olvidaste tu contraseña?
              </button>
            </div>

            <PrimaryButton
              loading={loading} label="Ingresar"
              loadingText="Ingresando..." onClick={handleLogin}
            />
          </div>
        </div>
      )}

      {/* ── RECUPERAR CONTRASEÑA ── */}
      {subView === "reset" && (
        <div className="w-full max-w-[320px]">
          <BackButton onClick={() => setSubView("main")} />

          <div className="mb-6 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(223,126,48,0.12)", border: "1px solid rgba(223,126,48,0.25)" }}
            >
              <svg className="h-8 w-8 text-[#df7e30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
          </div>

          <h2 className="mb-2 text-center text-xl font-bold text-[#f0f4f8]">
            Recuperar contraseña
          </h2>
          <p className="mb-6 text-center text-sm leading-relaxed text-[rgba(240,244,248,0.55)]">
            Ingresa el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
          </p>

          <div className="flex flex-col gap-3">
            <Field
              id="rs-em" label="Correo electrónico" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              icon={Ic.mail} error={errors.email} autoComplete="email" dark
            />
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#df7e30,#f09040)", boxShadow: "0 6px 20px rgba(223,126,48,.30)" }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white" style={{ animation: "spin .7s linear infinite" }} />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar enlace
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>

            {/* ¿No recuerdas el correo? Se busca por celular y se muestra una pista */}
            <div
              className="mt-2 rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <button
                type="button"
                onClick={() => setPistaAbierta((v) => !v)}
                aria-expanded={pistaAbierta}
                className="flex w-full items-center justify-between text-left text-xs font-semibold text-[rgba(240,244,248,0.65)]"
              >
                ¿No recuerdas con qué correo te registraste?
                <svg
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${pistaAbierta ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {pistaAbierta && (
                <div className="mt-3 flex flex-col gap-3">
                  <p className="text-xs leading-relaxed text-[rgba(240,244,248,0.45)]">
                    Escribe el celular con el que te registraste y te mostraremos una pista de tu correo.
                  </p>
                  <Field
                    id="rs-ph" label="Celular (9 dígitos)" type="tel" value={pistaPhone}
                    onChange={(e) => {
                      setPistaPhone(e.target.value.replace(/\D/g, "").slice(0, 9));
                      setPistaError("");
                      setPista(null);
                    }}
                    icon={Ic.key} error={pistaError} autoComplete="tel" dark
                  />
                  <button
                    type="button"
                    onClick={buscarPista}
                    disabled={pistaLoading}
                    className="w-full rounded-2xl py-3 text-sm font-semibold text-[#f0f4f8] transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ border: "1px solid var(--border-default)", background: "var(--bg-glass)" }}
                  >
                    {pistaLoading ? "Buscando..." : "Ver pista de mi correo"}
                  </button>

                  {pista?.hint && (
                    <p className="text-center text-xs text-[rgba(240,244,248,0.55)]">
                      Tu cuenta usa un correo parecido a{" "}
                      <span className="font-bold text-[#54aeb6]">{pista.hint}</span>.
                      Escríbelo completo arriba para recibir el enlace.
                    </p>
                  )}
                  {pista?.noEncontrada && (
                    <p className="text-center text-xs text-[rgba(240,244,248,0.55)]">
                      No encontramos una cuenta con ese celular. Prueba con otro número o pide ayuda a un administrador.
                    </p>
                  )}
                  <p className="text-center text-[11px] text-[rgba(240,244,248,0.35)]">
                    ¿Ya no tienes acceso a ese correo? Pide a un administrador que lo actualice.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ENLACE ENVIADO ── */}
      {subView === "success" && (
        <div className="flex w-full max-w-[320px] flex-col items-center">

          {/* Icono sobre con badge check */}
          <div className="relative mb-5">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: "rgba(84,174,182,0.12)", border: "1px solid rgba(84,174,182,0.25)" }}
            >
              <svg className="h-10 w-10 text-[#54aeb6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div
              className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: "#0b6e4f", border: "2.5px solid var(--bg-surface)" }}
            >
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>

          <h2 className="mb-1 text-xl font-bold text-[#f0f4f8]">¡Revisa tu correo!</h2>
          <p className="mb-0.5 text-sm text-[rgba(240,244,248,0.45)]">Si existe una cuenta con este correo, enviamos un enlace a</p>
          <p className="mb-5 break-all text-center text-sm font-semibold text-[#54aeb6]">{email}</p>

          {/* Consejos */}
          <div
            className="mb-5 w-full rounded-2xl px-4 py-3.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="mb-2 text-xs font-semibold text-[rgba(240,244,248,0.60)]">Consejos</p>
            <ul className="flex flex-col gap-1.5 text-xs text-[rgba(240,244,248,0.45)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#54aeb6]">·</span>
                Puede tardar 1–2 minutos en llegar
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#54aeb6]">·</span>
                Revisa tu carpeta de <span className="font-medium text-[rgba(240,244,248,0.65)]">spam</span> o correo no deseado
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#54aeb6]">·</span>
                Si no llega nada, quizá te registraste con otro correo
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#54aeb6]">·</span>
                El enlace expira en <span className="font-medium text-[rgba(240,244,248,0.65)]">1 hora</span>
              </li>
            </ul>
          </div>

          {/* Reenvío con countdown */}
          <div className="mb-3 w-full text-center">
            {resendDone ? (
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#54aeb6]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Correo reenviado
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resendLoading}
                className="text-xs font-medium transition-colors disabled:cursor-default"
                style={{ color: countdown > 0 ? "rgba(240,244,248,0.25)" : "#54aeb6" }}
              >
                {resendLoading
                  ? "Reenviando..."
                  : countdown > 0
                    ? `¿No llegó? Reenviar en ${countdown}s`
                    : "¿No llegó? Reenviar correo"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => { setPistaAbierta(true); setSubView("reset"); }}
            className="mb-3 text-xs font-medium text-[#df7e30] transition-colors hover:text-[#f09040]"
          >
            Probar con otro correo o buscarlo por celular
          </button>

          <button
            type="button"
            onClick={() => { resetForms(); setSubView("main"); }}
            className="w-full rounded-2xl py-3.5 text-sm font-medium text-[rgba(240,244,248,0.50)] transition-all hover:text-[#f0f4f8]"
            style={{ border: "1px solid var(--border-default)", background: "var(--bg-glass)" }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
