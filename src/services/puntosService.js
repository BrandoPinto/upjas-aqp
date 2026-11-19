import {
  doc, getDoc, setDoc,
  collection, serverTimestamp, runTransaction, query,
  where, getDocs, limit,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Caché de sesión — se limpia al recargar la página
let _configCache = null;

// Obtiene la configuración de puntos (valores editables)
export const getConfigPuntos = async () => {
  if (_configCache) return _configCache;
  const snap = await getDoc(doc(db, "config", "puntos"));
  _configCache = snap.exists() ? snap.data() : {
    asistencia: 1,
    actividadPequena: 3,
    actividadGrande: 5,
    invitacion: 2,
    plus: 10,
  };
  return _configCache;
};

// Invalida el caché cuando el admin actualiza la configuración
export const invalidarCacheConfig = () => { _configCache = null; };

// Verifica si ya se otorgó un punto de ese tipo hoy a ese usuario.
// asistencia: se chequea globalmente (solo uno por día sin importar quién lo da).
// Resto de tipos: se chequea por otorgante (cada uno puede dar el suyo una vez).
const yaSeOtorgoHoy = async (uidReceptor, tipo, uidOtorgante) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "users", uidReceptor, "historialPuntos"),
    where("fecha", ">=", hoy)
  );
  const snap = await getDocs(q);
  return snap.docs.some((d) => {
    const data = d.data();
    if (tipo === "asistencia") return data.tipo === tipo;
    return data.tipo === tipo && data.otorgadoPor === uidOtorgante;
  });
};

// Otorga puntos a un usuario
export const otorgarPuntos = async ({
  uidReceptor,
  uidOtorgante,
  rolOtorgante,
  tipo,           // "asistencia" | "actividadPequena" | "actividadGrande" | "invitacion" | "plus"
  eventoId    = null,
  eventoTitulo = null,
  nombreReceptor = null,
}) => {
  // Validar permisos por rol
  const permisosValidos = {
    maestro:  ["asistencia", "invitacion"],
    lider:    ["actividadPequena", "actividadGrande", "plus"],
    bienvenida: ["actividadPequena", "actividadGrande"],
    admin:    ["asistencia", "actividadPequena", "actividadGrande", "invitacion", "plus"],
  };

  if (!permisosValidos[rolOtorgante]?.includes(tipo)) {
    throw new Error("No tienes permiso para otorgar este tipo de punto.");
  }

  // Maestro: solo puede dar puntos a alumnos inscritos en sus clases
  if (rolOtorgante === "maestro") {
    const claseSnap = await getDocs(
      query(
        collection(db, "clases"),
        where("maestroUid", "==", uidOtorgante),
        where("inscritos", "array-contains", uidReceptor),
        limit(1)
      )
    );
    if (claseSnap.empty) {
      throw new Error("Este alumno no está inscrito en ninguna de tus clases.");
    }
  }

  // Verificar límite diario
  const duplicado = await yaSeOtorgoHoy(uidReceptor, tipo, uidOtorgante);
  if (duplicado) {
    throw new Error("Ya otorgaste este punto a este usuario hoy.");
  }

  // Obtener valor del punto
  const config = await getConfigPuntos();
  const valor = config[tipo];
  if (!valor) throw new Error("Tipo de punto inválido.");

  // Transacción: sumar puntos + guardar historial
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", uidReceptor);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error("Usuario no encontrado.");

    const puntosActuales = userSnap.data().puntos ?? 0;

    // Actualizar puntos
    tx.update(userRef, { puntos: puntosActuales + valor });

    // Guardar en historial
    const historialRef = doc(collection(db, "users", uidReceptor, "historialPuntos"));
    tx.set(historialRef, {
      tipo,
      valor,
      otorgadoPor: uidOtorgante,
      rolOtorgante,
      fecha: serverTimestamp(),
      descripcion: obtenerDescripcion(tipo, eventoTitulo),
      ...(eventoId ? { eventoId, eventoTitulo } : {}),
    });
  });

  // Registrar asistencia confirmada si se indicó un evento
  if (eventoId) {
    await setDoc(
      doc(db, "asistencias", `${eventoId}_${uidReceptor}`),
      {
        eventoId,
        uid: uidReceptor,
        nombre: nombreReceptor ?? uidReceptor,
        estado: "confirmado",
        confirmadoEn: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return valor;
};

// Obtener perfil de usuario por UID (para mostrar tras escanear)
export const getUsuarioPorUID = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const obtenerDescripcion = (tipo, eventoTitulo = null) => {
  const base = {
    asistencia:       "Asistencia a Instituto",
    actividadPequena: "Actividad Pequeña",
    actividadGrande:  "Actividad Grande",
    invitacion:       "Invitación a un amigo",
    plus:             "Plus",
  }[tipo] ?? tipo;
  return eventoTitulo ? `${base} – ${eventoTitulo}` : base;
};