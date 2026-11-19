import { useRef, useState } from "react";

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

const hoyIso = () => {
  const h = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${h.getFullYear()}-${p(h.getMonth() + 1)}-${p(h.getDate())}`;
};

/**
 * Fecha de nacimiento: se puede escribir como DD/MM/AAAA (con máscara) o elegir
 * en el calendario. `value` y `onChange` usan siempre formato ISO "AAAA-MM-DD"
 * (o "" si la fecha está incompleta o es inválida), igual que antes con type="date".
 */
export default function FechaNacimientoInput({
  value,
  onChange,
  id,
  wrapperClass = "",
  inputClass = "",
  iconClass = "",
}) {
  const pickerRef = useRef(null);
  // Texto que está escribiendo la persona (puede estar incompleto)
  const [borrador, setBorrador] = useState("");

  // Si el borrador coincide con el valor, se muestra tal cual (permite fechas a medio escribir).
  // Si no coincide (calendario, reinicio del formulario, datos cargados), manda `value`.
  const texto = textoAIso(borrador) === (value ?? "") ? borrador : isoATexto(value);
  const invalida = texto.length === 10 && textoAIso(texto) === "";

  const handleTexto = (e) => {
    const masked = aplicarMascara(e.target.value);
    setBorrador(masked);
    onChange(textoAIso(masked));
  };

  const abrirCalendario = () => {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); return; } catch { /* se intenta con foco */ }
    }
    el.focus();
    el.click();
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
          onClick={abrirCalendario}
          aria-label="Abrir calendario"
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 opacity-60 transition hover:opacity-100 ${iconClass}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </button>
        {/* Selector nativo oculto: solo se usa para abrir el calendario */}
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          min="1900-01-01"
          max={hoyIso()}
          value={value ?? ""}
          onChange={(e) => {
            setBorrador("");
            onChange(e.target.value);
          }}
          className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
        />
      </div>
      {invalida && <p className="mt-1 text-xs font-medium text-[#d74468]">Fecha no válida</p>}
    </div>
  );
}
