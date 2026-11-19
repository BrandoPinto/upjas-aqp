import { useEffect } from "react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import { Ic } from "../../constants/authIcons";
import { useEstacas } from "../../hooks/useEstacas";

export default function PanelRegister({
  isRegister,
  name, setName,
  lastName, setLastName,
  email, setEmail,
  password, setPassword,
  phone, setPhone,
  birthDate, setBirthDate,
  gender, setGender,
  relation, setRelation,
  stateValue, setStateValue,
  parish, setParish,
  termsAccepted, setTermsAccepted,
  showPw, setShowPw,
  errors,
  loading,
  handleRegister,
}) {
  const { estacas, barrios, loadingEstacas, loadingBarrios, fetchBarrios } = useEstacas();

  useEffect(() => {
    fetchBarrios(stateValue);
    setParish("");
  }, [stateValue]);

  const inputSelectClass =
    "w-full rounded-2xl px-4 py-3 text-sm outline-none transition " +
    "text-[#f0f4f8] bg-[#1a2f47] border border-white/10 " +
    "focus:border-[#54aeb6]/45 focus:bg-[#1a2f47] " +
    "disabled:opacity-50 disabled:cursor-wait";

  return (
    <div
      className={`
        relative z-[1] flex w-full flex-col items-center
        px-6 sm:px-10
        transition-[transform,opacity,max-height,padding] duration-700 ease-in-out
        md:absolute md:inset-0 md:left-1/2 md:right-0 md:w-1/2
        md:overflow-y-auto md:rounded-r-[28px]
        md:pt-10 md:pb-10
        ${isRegister
          ? "max-h-[3000px] pt-8 pb-10 translate-y-0 pointer-events-auto opacity-100 md:translate-x-0 md:pt-10"
          : "max-h-0 py-0 overflow-hidden -translate-y-3 pointer-events-none opacity-0 md:max-h-none md:-translate-x-full md:pointer-events-none md:opacity-0"
        }
      `}
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="flex w-full max-w-[320px] flex-col items-center">

        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-[#54aeb6]"
          style={{
            background: "rgba(84,174,182,0.12)",
            border: "1px solid rgba(84,174,182,0.25)",
          }}
        >
          {Ic.user}
        </div>
        <h1 className="mb-0.5 text-2xl font-bold text-[#f0f4f8]">Crear Perfil</h1>
        <p className="mb-6 text-sm text-[rgba(240,244,248,0.55)]">Únete a UP JAS AQP</p>

        <div className="flex w-full flex-col gap-3">

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="r-name" label="Nombres" value={name}
              onChange={(e) => setName(e.target.value)}
              icon={Ic.user} error={errors.name} autoComplete="given-name" dark
            />
            <Field
              id="r-lastname" label="Apellidos" value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              icon={Ic.user} error={errors.lastName} autoComplete="family-name" dark
            />
          </div>

          {/* Correo */}
          <Field
            id="r-em" label="Correo Personal" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Ic.mail} error={errors.email} autoComplete="email" dark
          />

          {/* Contraseña */}
          <Field
            id="r-pw" label="Contraseña (mín 6)"
            type={showPw ? "text" : "password"} value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Ic.lock} error={errors.password} autoComplete="new-password" dark
            right={
              <button type="button" onClick={() => setShowPw((v) => !v)}>
                {showPw ? Ic.eyeOff : Ic.eyeOn}
              </button>
            }
          />

          {/* Celular */}
          <Field
            id="r-phone" label="Celular (9 dígitos)" type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={Ic.key} error={errors.phone} autoComplete="tel" dark
          />

          {/* Fecha de nacimiento + Género */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl px-4 py-3 transition focus-within:border-[#54aeb6]/45"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[rgba(240,244,248,0.40)]">
                F. de nacimiento
              </label>
              <input
                type="date" value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-2 w-full bg-transparent text-sm text-[#f0f4f8] outline-none"
              />
            </div>
            <div
              className="rounded-2xl px-4 py-3 transition focus-within:border-[#54aeb6]/45"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[rgba(240,244,248,0.40)]">
                Género
              </label>
              <select
                value={gender} onChange={(e) => setGender(e.target.value)}
                className="mt-2 w-full bg-transparent text-sm text-[#f0f4f8] outline-none"
              >
                <option value="" className="bg-[#1a2f47]">Selecciona</option>
                <option value="masculino" className="bg-[#1a2f47]">Masculino</option>
                <option value="femenino" className="bg-[#1a2f47]">Femenino</option>
              </select>
            </div>
          </div>

          {errors.birthDate && <p className="-mt-1 ml-1 text-xs font-medium text-[#d74468]">{errors.birthDate}</p>}
          {errors.gender && <p className="-mt-1 ml-1 text-xs font-medium text-[#d74468]">{errors.gender}</p>}

          {/* ── Relación con la iglesia ── */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[rgba(240,244,248,0.40)]">
              ¿Eres Miembro de la Iglesia?
            </p>

            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-sm font-medium text-[#f0f4f8]">
                <input
                  type="radio" name="relation" value="miembro"
                  checked={relation === "miembro"}
                  onChange={(e) => setRelation(e.target.value)}
                  className="h-4 w-4 accent-[#2d69a3]"
                />
                Soy Miembro
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#f0f4f8]">
                <input
                  type="radio" name="relation" value="invitado"
                  checked={relation === "invitado"}
                  onChange={(e) => {
                    setRelation(e.target.value);
                    setStateValue("");
                    setParish("");
                  }}
                  className="h-4 w-4 accent-[#2d69a3]"
                />
                Soy Invitado
              </label>
            </div>

            {errors.relation && <p className="mt-2 text-xs font-medium text-[#d74468]">{errors.relation}</p>}

            {/* Estaca y Barrio — solo si es miembro */}
            {relation === "miembro" && (
              <div className="mt-4 flex flex-col gap-3">
                <select
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  disabled={loadingEstacas}
                  className={inputSelectClass}
                >
                  <option value="" className="bg-[#1a2f47]">
                    {loadingEstacas ? "Cargando estacas..." : "Selecciona Estaca"}
                  </option>
                  {estacas.map((est) => (
                    <option key={est.id} value={est.id} className="bg-[#1a2f47]">{est.nombre}</option>
                  ))}
                </select>
                {errors.stateValue && <p className="-mt-1 text-xs font-medium text-[#d74468]">{errors.stateValue}</p>}

                {stateValue && (
                  <>
                    <select
                      value={parish}
                      onChange={(e) => setParish(e.target.value)}
                      disabled={loadingBarrios}
                      className={inputSelectClass}
                    >
                      <option value="" className="bg-[#1a2f47]">
                        {loadingBarrios ? "Cargando barrios..." : "Selecciona Barrio"}
                      </option>
                      {barrios.map((b) => (
                        <option key={b.id} value={b.id} className="bg-[#1a2f47]">{b.nombre}</option>
                      ))}
                    </select>
                    {errors.parish && <p className="-mt-1 text-xs font-medium text-[#d74468]">{errors.parish}</p>}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Términos */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          >
            <label className="flex items-start gap-3 text-sm text-[#f0f4f8]">
              <input
                type="checkbox" checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#2d69a3]"
              />
              <span>
                <span className="font-semibold">Acepto los términos de privacidad.</span>
                <span className="mt-1 block text-xs leading-relaxed text-[rgba(240,244,248,0.40)]">
                  La información proporcionada será utilizada exclusivamente
                  para fines organizativos y académicos de UP JAS AQP.
                  Tus datos están seguros.
                </span>
              </span>
            </label>
            {errors.termsAccepted && <p className="mt-2 text-xs font-medium text-[#d74468]">{errors.termsAccepted}</p>}
          </div>

          <PrimaryButton
            loading={loading} label="Registrarme"
            loadingText="Creando cuenta..." onClick={handleRegister}
          />

        </div>
      </div>
    </div>
  );
}
