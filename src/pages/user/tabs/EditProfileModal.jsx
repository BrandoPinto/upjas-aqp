import { useEffect, useState } from "react";
import { useEstacas } from "../../../hooks/useEstacas";
import { updateUserProfile } from "../../../services/authService";

export default function EditProfileModal({ profile, onClose }) {
  const [name, setName]           = useState(profile?.name ?? "");
  const [lastName, setLastName]   = useState(profile?.lastName ?? "");
  const [phone, setPhone]         = useState(profile?.phone ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? "");
  const [gender, setGender]       = useState(profile?.gender ?? "");
  const [relation, setRelation]   = useState(profile?.relation ?? "");
  const [stateValue, setStateValue] = useState(profile?.stateValue ?? "");
  const [parish, setParish]       = useState(profile?.parish ?? "");
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [saved, setSaved]         = useState(false);

  const { estacas, barrios, loadingEstacas, loadingBarrios, fetchBarrios } = useEstacas();

  useEffect(() => {
    fetchBarrios(stateValue);
  }, [stateValue]);

  const validate = () => {
    const e = {};
    if (!name.trim())    e.name     = "Ingresa tu nombre";
    if (!lastName.trim()) e.lastName = "Ingresa tu apellido";
    if (!phone || phone.length !== 9) e.phone = "Ingresa 9 dígitos";
    if (!birthDate)      e.birthDate = "Ingresa tu fecha de nacimiento";
    if (!gender)         e.gender   = "Selecciona tu género";
    if (!relation)       e.relation = "Selecciona tu relación";
    if (relation === "miembro") {
      if (!stateValue)   e.stateValue = "Selecciona una estaca";
      if (!parish)       e.parish     = "Selecciona un barrio";
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await updateUserProfile(profile.uid, { name, lastName, phone, birthDate, gender, relation, stateValue, parish });
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      if (err?.code === "phone/already-in-use") {
        setErrors({ phone: "Este número ya está registrado." });
      } else {
        setErrors({ general: "Error al guardar. Intenta de nuevo." });
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400";
  const labelClass = "mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide";
  const errClass   = "mt-0.5 text-xs text-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white px-5 pt-5 pb-8 shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <h2 className="mb-4 text-center text-base font-bold text-slate-700">Editar Mis Datos</h2>

        {errors.general && (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-500">{errors.general}</p>
        )}
        {saved && (
          <p className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-center text-sm text-green-600 font-semibold">¡Datos guardados!</p>
        )}

        <div className="flex flex-col gap-3">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nombres</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
              {errors.name && <p className={errClass}>{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Apellidos</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldClass} />
              {errors.lastName && <p className={errClass}>{errors.lastName}</p>}
            </div>
          </div>

          {/* Celular */}
          <div>
            <label className={labelClass}>Celular (9 dígitos)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
            {errors.phone && <p className={errClass}>{errors.phone}</p>}
          </div>

          {/* Fecha y Género */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>F. de nacimiento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={fieldClass} />
              {errors.birthDate && <p className={errClass}>{errors.birthDate}</p>}
            </div>
            <div>
              <label className={labelClass}>Género</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={fieldClass}>
                <option value="">Selecciona</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
              {errors.gender && <p className={errClass}>{errors.gender}</p>}
            </div>
          </div>

          {/* Relación */}
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">¿Eres Miembro?</p>
            <div className="flex gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="edit-relation" value="miembro"
                  checked={relation === "miembro"}
                  onChange={() => { setRelation("miembro"); }}
                  className="h-4 w-4 accent-blue-600"
                />
                Soy Miembro
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="edit-relation" value="invitado"
                  checked={relation === "invitado"}
                  onChange={() => { setRelation("invitado"); setStateValue(""); setParish(""); }}
                  className="h-4 w-4 accent-blue-600"
                />
                Soy Invitado
              </label>
            </div>
            {errors.relation && <p className={errClass}>{errors.relation}</p>}

            {relation === "miembro" && (
              <div className="mt-3 flex flex-col gap-2">
                <select
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  disabled={loadingEstacas}
                  className={fieldClass}
                >
                  <option value="">{loadingEstacas ? "Cargando estacas..." : "Selecciona Estaca"}</option>
                  {estacas.map((est) => (
                    <option key={est.id} value={est.id}>{est.nombre}</option>
                  ))}
                </select>
                {errors.stateValue && <p className={errClass}>{errors.stateValue}</p>}

                {stateValue && (
                  <>
                    <select
                      value={parish}
                      onChange={(e) => setParish(e.target.value)}
                      disabled={loadingBarrios}
                      className={fieldClass}
                    >
                      <option value="">{loadingBarrios ? "Cargando barrios..." : "Selecciona Barrio"}</option>
                      {barrios.map((b) => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                      ))}
                    </select>
                    {errors.parish && <p className={errClass}>{errors.parish}</p>}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botones */}
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="mt-1 w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
