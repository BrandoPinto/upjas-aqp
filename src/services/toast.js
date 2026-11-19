// Avisos (toast) accesibles desde cualquier parte, también fuera de React
// (servicios, manejadores globales). El componente <Toaster /> los dibuja.
const oyentes = new Set();

export const suscribirToasts = (fn) => {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
};

// tipo: "error" | "ok" | "info"
export const mostrarToast = (texto, tipo = "error") => {
  oyentes.forEach((fn) => fn({ texto, tipo }));
};

// Convierte un error técnico (Firebase u otro) en un mensaje comprensible
export const mensajeDeError = (err, porDefecto = "Ocurrió un error. Intenta de nuevo.") => {
  const code = String(err?.code ?? "");
  if (code.includes("permission-denied")) return "No tienes permiso para realizar esta acción.";
  if (code.includes("unavailable") || code === "auth/network-request-failed") {
    return "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.";
  }
  if (code.includes("unauthenticated")) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  return porDefecto;
};
