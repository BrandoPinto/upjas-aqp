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
        t: "Quién trata tus datos",
        p: "Los organizadores de UP JAS AQP tratan los datos personales que registras en esta aplicación, de acuerdo con la Ley N° 29733, Ley de Protección de Datos Personales, y su reglamento.",
      },
      {
        t: "Qué datos recopilamos",
        p: "Nombres y apellidos, correo electrónico, número de celular, fecha de nacimiento, género, si eres miembro de la Iglesia o invitado y, si eres miembro, tu estaca y barrio. También se guardan tus puntos, tu historial de puntos, tus inscripciones a clases y tu asistencia a eventos.",
      },
      {
        t: "Para qué los usamos",
        p: "Para crear y mantener tu cuenta y tu pase digital, inscribirte en clases y eventos, registrar tu asistencia y tus puntos, y elaborar reportes de organización (por ejemplo, listas de asistencia). No usamos tus datos para publicidad ni los vendemos.",
      },
      {
        t: "Quién puede ver tus datos",
        p: "Tú, y el personal autorizado de UP JAS AQP (maestros, líderes y administradores), solo en la medida necesaria para organizar clases y eventos y registrar puntos.",
      },
      {
        t: "Dónde se guardan",
        p: "Tus datos se almacenan en los servicios en la nube de Google (Firebase), cuyos servidores pueden encontrarse fuera del Perú. Al aceptar autorizas esa transferencia.",
      },
      {
        t: "Cuánto tiempo los conservamos",
        p: "Mientras mantengas tu cuenta. Si la eliminas, se borran tu perfil, tu historial de puntos, tus asistencias y tus inscripciones. Esta acción no se puede deshacer. Tu identificador interno podría permanecer en listas de clases hasta que los organizadores las actualicen.",
      },
      {
        t: "Tus derechos (ARCO)",
        p: "Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición en la aplicación, en Mi Pase › Privacidad y mis datos: descargar una copia de tus datos, corregirlos, eliminar tu cuenta o enviar una solicitud a los organizadores.",
      },
      {
        t: "Menores de edad",
        p: "Si eres menor de edad, debes contar con la autorización de tu padre, madre o tutor para usar esta aplicación.",
      },
      {
        t: "Cambios",
        p: "Si esta política cambia de forma importante, te lo mostraremos en la aplicación y te pediremos aceptarla de nuevo.",
      },
    ],
  },

  terminos: {
    titulo: "Términos y Condiciones",
    secciones: [
      {
        t: "Tu cuenta",
        p: "Debes dar datos verdaderos y mantenerlos actualizados. Cada persona puede tener una sola cuenta. Tu código QR es personal: no lo compartas.",
      },
      {
        t: "Puntos",
        p: "Los puntos son un reconocimiento por tu participación y no tienen valor en dinero. Los organizadores pueden corregir o retirar puntos otorgados por error o por uso indebido.",
      },
      {
        t: "Uso adecuado",
        p: "No debes intentar acceder a datos de otras personas, alterar tus puntos ni usar la aplicación para fines distintos a los de UP JAS AQP.",
      },
      {
        t: "Suspensión",
        p: "Los organizadores pueden suspender o eliminar cuentas que incumplan estos términos.",
      },
      {
        t: "Cambios",
        p: "Podemos actualizar estos términos. Si el cambio es importante, te pediremos aceptarlos de nuevo.",
      },
    ],
  },

  datos: {
    titulo: "Autorización para el tratamiento de datos personales",
    secciones: [
      {
        t: "Qué autorizas",
        p: "Autorizo a los organizadores de UP JAS AQP a tratar mis datos personales (identificación, contacto, fecha de nacimiento, género, vínculo con la Iglesia, estaca y barrio, puntos y asistencia) para las finalidades descritas en la Política de Privacidad.",
      },
      {
        t: "A quién se muestran",
        p: "Autorizo que mis datos puedan ser vistos por el personal autorizado (maestros, líderes y administradores) y que se incluyan en reportes de organización de clases y eventos.",
      },
      {
        t: "Almacenamiento y transferencia",
        p: "Autorizo que mis datos se almacenen en servicios en la nube de Google (Firebase), incluso en servidores ubicados fuera del Perú.",
      },
      {
        t: "Puedo retirar mi autorización",
        p: "Puedo revocar esta autorización en cualquier momento eliminando mi cuenta o enviando una solicitud desde Mi Pase › Privacidad y mis datos. Sin esta autorización no es posible usar la aplicación.",
      },
    ],
  },
};
