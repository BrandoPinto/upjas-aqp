import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const ANIO_MINIMO = 1920;

const pad = (n) => String(n).padStart(2, "0");

// Convierte "2005-03-09" → "09/03/2005"
const isoATexto = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Convierte "09/03/2005" → "2005-03-09". Devuelve "" si la fecha no existe,
// es futura o anterior a 1900.
const textoAIso = (texto) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return "";
  const [, d, mes, y] = m;
  const fecha = new Date(Number(y), Number(mes) - 1, Number(d));
  const existe =
    fecha.getFullYear() === Number(y) &&
    fecha.getMonth() === Number(mes) - 1 &&
    fecha.getDate() === Number(d);
  if (!existe || Number(y) < 1900 || fecha > new Date()) return "";
  return `${y}-${mes}-${d}`;
};

// Deja solo dígitos y agrega las "/" mientras se escribe
const aplicarMascara = (raw) => {
  const dig = raw.replace(/\D/g, "").slice(0, 8);
  if (dig.length <= 2) return dig;
  if (dig.length <= 4) return `${dig.slice(0, 2)}/${dig.slice(2)}`;
  return `${dig.slice(0, 2)}/${dig.slice(2, 4)}/${dig.slice(4)}`;
};

// "2005-03-09" → { d: "9", m: "3", y: "2005" } (sin ceros a la izquierda, como los <option>)
const partesDeIso = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? { y: String(Number(m[1])), m: String(Number(m[2])), d: String(Number(m[3])) } : null;
};

const diasDelMes = (mes, anio) => new Date(Number(anio), Number(mes), 0).getDate();

const claseSelect =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400";

// Hoja inferior con listas de día, mes y año: elegir un año de nacimiento toma 3 toques
// (en el calendario nativo hay que retroceder mes por mes).
function HojaSelector({ value, onElegir, onCerrar }) {
  const anioActual = new Date().getFullYear();
  const inicial = partesDeIso(value);

  const [dia, setDia]   = useState(inicial?.d ?? "");
  const [mes, setMes]   = useState(inicial?.m ?? "");
  // Sin fecha previa, el año arranca en uno razonable (hace 18 años) para no tener que bajar desde hoy
  const [anio, setAnio] = useState(inicial?.y ?? String(anioActual - 18));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  const maxDia = mes && anio ? diasDelMes(mes, anio) : 31;
  // Si el día elegido no existe en el mes (ej. 31 en abril), se muestra como sin elegir
  const diaValido = dia && Number(dia) <= maxDia ? dia : "";

  const completa = !!(diaValido && mes && anio);
  const iso = completa ? `${anio}-${pad(mes)}-${pad(diaValido)}` : "";
  const futura = completa && new Date(`${iso}T00:00:00`) > new Date();

  const anios = [];
  for (let a = anioActual; a >= ANIO_MINIMO; a--) anios.push(a);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:px-4">
      <button aria-label="Cerrar" className="absolute inset-0 cursor-default" onClick={onCerrar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Elegir fecha de nacimiento"
        className="relative w-full rounded-t-3xl bg-white px-5 pb-6 pt-3 shadow-2xl sm:max-w-sm sm:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
        <h2 className="mb-4 text-base font-bold text-slate-800">Fecha de nacimiento</h2>

        <div className="grid grid-cols-[1fr_1.7fr_1.2fr] gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Día</span>
            <select value={diaValido} onChange={(e) => setDia(e.target.value)} className={claseSelect}>
              <option value="">Día</option>
              {Array.from({ length: maxDia }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mes</span>
            <select value={mes} onChange={(e) => setMes(e.target.value)} className={claseSelect}>
              <option value="">Mes</option>
              {MESES.map((nombre, i) => (
                <option key={nombre} value={i + 1}>{nombre}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Año</span>
            <select value={anio} onChange={(e) => setAnio(e.target.value)} className={claseSelect}>
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 min-h-[1.25rem] text-center text-sm">
          {futura ? (
            <span className="font-medium text-red-500">La fecha no puede ser futura.</span>
          ) : completa ? (
            <span className="font-semibold text-slate-600">{isoATexto(iso)}</span>
          ) : (
            <span className="text-slate-400">Elige día, mes y año</span>
          )}
        </p>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onElegir(iso)}
            disabled={!completa || futura}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #1a4270, #2d69a3)" }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Fecha de nacimiento: se puede escribir como DD/MM/AAAA (con máscara) o elegir con
 * listas de día, mes y año. `value` y `onChange` usan siempre formato ISO "AAAA-MM-DD"
 * (o "" si la fecha está incompleta o es inválida).
 */
export default function FechaNacimientoInput({
  value,
  onChange,
  id,
  wrapperClass = "",
  inputClass = "",
  iconClass = "",
}) {
  const [abierto, setAbierto] = useState(false);
  // Texto que está escribiendo la persona (puede estar incompleto)
  const [borrador, setBorrador] = useState("");

  // Si el borrador coincide con el valor, se muestra tal cual (permite fechas a medio escribir).
  // Si no coincide (selector, reinicio del formulario, datos cargados), manda `value`.
  const texto = textoAIso(borrador) === (value ?? "") ? borrador : isoATexto(value);
  const invalida = texto.length === 10 && textoAIso(texto) === "";

  const handleTexto = (e) => {
    const masked = aplicarMascara(e.target.value);
    setBorrador(masked);
    onChange(textoAIso(masked));
  };

  const elegir = (iso) => {
    setBorrador("");
    onChange(iso);
    setAbierto(false);
  };

  return (
    <div className={wrapperClass}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          value={texto}
          onChange={handleTexto}
          aria-invalid={invalida}
          className={`${inputClass} pr-8`}
        />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Elegir fecha con día, mes y año"
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 opacity-60 transition hover:opacity-100 ${iconClass}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </button>
      </div>
      {invalida && <p className="mt-1 text-xs font-medium text-[#d74468]">Fecha no válida</p>}

      {abierto && <HojaSelector value={value} onElegir={elegir} onCerrar={() => setAbierto(false)} />}
    </div>
  );
}
