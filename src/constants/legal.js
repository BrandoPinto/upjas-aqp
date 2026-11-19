// ───────────────────────────────────────────────────────────────────────────
// TEXTOS LEGALES — BORRADOR
// Redactados a partir de los datos que la app realmente guarda y de lo que hace
// con ellos. Deben ser REVISADOS por un asesor legal (Ley N° 29733) antes de
// considerarse definitivos: falta completar quién es el titular del banco de
// datos, un medio de contacto oficial y los plazos de atención de solicitudes.
//
// Si se modifica cualquier texto de fondo, se cambia VERSION_LEGAL: la app le
// volverá a pedir su aceptación a todas las personas con cuenta.
// ───────────────────────────────────────────────────────────────────────────

export const VERSION_LEGAL = "2026-11-19";

// Estado inicial de las tres casillas: ninguna viene marcada
export const CONSENTIMIENTOS_VACIOS = { privacidad: false, terminos: false, datos: false };

export const todosAceptados = (c) => !!(c?.privacidad && c?.terminos && c?.datos);

export const TEXTOS_LEGALES = {
  privacidad: {
    titulo: "Política de Privacidad",
    secciones: [
      {
        t: "Para qué usamos tus datos",
        p: "Los organizadores de UP JAS AQP tratan tus datos, conforme a la Ley N° 29733, para gestionar tu cuenta y pase digital, inscribirte en clases y eventos, registrar tu asistencia y puntos, y preparar reportes de organización. No los usamos para publicidad ni los vendemos.",
      },
      {
        t: "Qué datos guardamos",
        p: "Nombres y apellidos, correo, celular, fecha de nacimiento, género, vínculo con la Iglesia, estaca y barrio, y tus puntos y asistencia.",
      },
      {
        t: "Quién los ve y dónde se guardan",
        p: "Tú y el personal autorizado (maestros, líderes y administradores). Se almacenan en servicios de Google (Firebase), cuyos servidores pueden estar fuera del Perú.",
      },
      {
        t: "Cuánto tiempo",
        p: "Mientras tengas cuenta. Si la eliminas, se borran tu perfil, puntos, asistencias e inscripciones; no se puede deshacer. Tu identificador podría quedar en listas de clases hasta que se actualicen.",
      },
      {
        t: "Tus derechos",
        p: "Desde Mi Pase › Privacidad y mis datos puedes descargar una copia de tus datos, corregirlos o eliminar tu cuenta. Para oponerte a algún uso de tus datos, comunícate con los organizadores.",
      },
      {
        t: "Menores y cambios",
        p: "Si eres menor de edad, necesitas autorización de tu padre, madre o tutor. Si esta política cambia de forma importante, te pediremos aceptarla de nuevo.",
      },
    ],
  },

  terminos: {
    titulo: "Términos y Condiciones",
    secciones: [
      {
        t: "Tu cuenta",
        p: "Da datos verdaderos, usa una sola cuenta por persona y no compartas tu código QR.",
      },
      {
        t: "Puntos",
        p: "Son un reconocimiento sin valor en dinero. Pueden corregirse o retirarse si se otorgaron por error o por uso indebido.",
      },
      {
        t: "Uso y cambios",
        p: "No intentes acceder a datos de otras personas ni alterar tus puntos. Podemos suspender las cuentas que incumplan estos términos y actualizarlos; si el cambio es importante, te pediremos aceptarlos de nuevo.",
      },
    ],
  },

  datos: {
    titulo: "Autorización para el tratamiento de datos personales",
    secciones: [
      {
        t: "Qué autorizas",
        p: "Autorizo el tratamiento de mis datos personales para las finalidades de la Política de Privacidad, que el personal autorizado los vea y que se guarden en servicios de Google (Firebase), incluso fuera del Perú.",
      },
      {
        t: "Puedo retirarla",
        p: "Puedo retirar esta autorización eliminando mi cuenta desde Mi Pase › Privacidad y mis datos. Sin ella no es posible usar la aplicación.",
      },
    ],
  },
};
