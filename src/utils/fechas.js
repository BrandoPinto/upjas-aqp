// Fecha guardada ("2026-11-19") → formato para mostrar a las personas: "19/11/2026"
// Si el texto no tiene el formato esperado, se devuelve tal cual.
export const formatearFechaIso = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso ?? "");
};

// Fecha de HOY en la zona horaria del dispositivo, como "AAAA-MM-DD" (el formato en que
// se guarda la fecha de los eventos).
// No usar new Date().toISOString(): da la fecha en UTC y en Perú (UTC-5), desde las 7 pm,
// ya marcaría "mañana".
export const hoyLocalIso = () => {
  const h = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${h.getFullYear()}-${p(h.getMonth() + 1)}-${p(h.getDate())}`;
};
