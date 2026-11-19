// Portales de la app. `role: null` = disponible para cualquier usuario con sesión.
// `color` e `descripcion` los usa el selector de portal (PortalSwitcher).
export const PORTALES = [
  { key: "usuario", label: "Usuario", path: "/",        role: null,      color: "#2d69a3", descripcion: "Tu pase, clases y puntos" },
  { key: "maestro", label: "Maestro", path: "/maestro", role: "maestro", color: "#059669", descripcion: "Dar puntos y ver tu clase" },
  { key: "lider",   label: "Líder",   path: "/lider",   role: "lider",   color: "#7c3aed", descripcion: "Registrar asistencia con el escáner" },
  { key: "admin",   label: "Admin",   path: "/admin",   role: "admin",   color: "#b91c1c", descripcion: "Gestión completa" },
];

// ── Último portal usado (solo en este dispositivo, separado por usuario) ──
const claveUltimoPortal = (uid) => `upjas:ultimoPortal:${uid}`;

export const guardarUltimoPortal = (uid, path) => {
  if (!uid) return;
  try { localStorage.setItem(claveUltimoPortal(uid), path); }
  catch { /* sin acceso a localStorage: simplemente no se recuerda */ }
};

// A dónde llevar a una persona al iniciar sesión: el último portal que usó,
// siempre que todavía tenga acceso a él; si no, la pantalla de usuario.
export const rutaInicial = (profile) => {
  if (!profile?.uid) return "/";
  try {
    const guardada = localStorage.getItem(claveUltimoPortal(profile.uid));
    if (guardada && portalesDisponibles(profile).some((p) => p.path === guardada)) return guardada;
  } catch { /* sin acceso a localStorage */ }
  return "/";
};

// Portales a los que puede entrar un perfil. El admin accede a todos
// (igual que en RoleRoute del router).
export const portalesDisponibles = (profile) => {
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  const esAdmin = roles.includes("admin");
  return PORTALES.filter((p) => p.role === null || esAdmin || roles.includes(p.role));
};
