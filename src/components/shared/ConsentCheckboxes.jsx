import { useState } from "react";
import LegalModal from "./LegalModal";

const OPCIONES = [
  { k: "privacidad", texto: "He leído y acepto la", enlace: "Política de Privacidad" },
  { k: "terminos",   texto: "Acepto los",           enlace: "Términos y Condiciones" },
  { k: "datos",      texto: "Autorizo el",          enlace: "tratamiento de mis datos personales" },
];

// Tres casillas independientes (ninguna viene marcada) y cada una abre su texto completo.
// `dark` = estilos para el registro (fondo oscuro); sin `dark` = para modales claros.
export default function ConsentCheckboxes({ value, onChange, error, dark = false }) {
  const [leyendo, setLeyendo] = useState(null);

  const colorTexto  = dark ? "text-[#f0f4f8]" : "text-slate-700";
  const colorEnlace = dark ? "text-[#54aeb6]" : "text-blue-600";
  const colorSuave  = dark ? "text-[rgba(240,244,248,0.40)]" : "text-slate-400";

  return (
    <div className="flex flex-col gap-3">
      <p className={`text-xs leading-relaxed ${colorSuave}`}>
        Para usar la aplicación necesitamos tu aceptación en cada punto. Toca el nombre para leer el texto completo.
      </p>

      {OPCIONES.map(({ k, texto, enlace }) => (
        <div key={k} className="flex items-start gap-3">
          <input
            id={`consent-${k}`}
            type="checkbox"
            checked={!!value?.[k]}
            onChange={(e) => onChange({ ...value, [k]: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2d69a3]"
          />
          <span className={`text-sm leading-snug ${colorTexto}`}>
            <label htmlFor={`consent-${k}`} className="cursor-pointer">{texto} </label>
            <button
              type="button"
              onClick={() => setLeyendo(k)}
              className={`font-semibold underline underline-offset-2 ${colorEnlace}`}
            >
              {enlace}
            </button>
          </span>
        </div>
      ))}

      {error && <p className="text-xs font-medium text-[#d74468]">{error}</p>}

      {leyendo && <LegalModal k={leyendo} onCerrar={() => setLeyendo(null)} />}
    </div>
  );
}
