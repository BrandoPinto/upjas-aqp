// Portales de la app. `role: null` = disponible para cualquier usuario con sesión.
export const PORTALES = [
  { key: "usuario",    label: "Usuario",    path: "/",           role: null },
  { key: "maestro",    label: "Maestro",    path: "/maestro",    role: "maestro" },
  { key: "lider",      label: "Líder",      path: "/lider",      role: "lider" },
  { key: "admin",      label: "Admin",      path: "/admin",      role: "admin" },
];

// Portales a los que puede entrar un perfil. El admin accede a todos
// (igual que en RoleRoute del router).
export const portalesDisponibles = (profile) => {
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  const esAdmin = roles.includes("admin");
  return PORTALES.filter((p) => p.role === null || esAdmin || roles.includes(p.role));
};
