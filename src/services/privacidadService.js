import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, writeBatch, serverTimestamp,
} from "firebase/firestore";
import {
  EmailAuthProvider, reauthenticateWithCredential, deleteUser,
} from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { VERSION_LEGAL } from "../constants/legal";

// Mientras se elimina la cuenta, AuthContext no debe cerrar sesión solo al ver
// desaparecer el perfil (necesitamos seguir autenticados hasta borrar el usuario de Auth).
export const estadoEliminacion = { enCurso: false };

// Constancia de aceptación: qué se aceptó, cuándo y con qué versión de los textos
export const nuevaConstanciaConsentimiento = () => ({
  privacidad: true,
  terminos: true,
  datos: true,
  version: VERSION_LEGAL,
  aceptadoEn: serverTimestamp(),
});

// ── CONSENTIMIENTO (cuentas existentes que aún no aceptaron esta versión) ──
export const aceptarConsentimientos = (uid) =>
  updateDoc(doc(db, "users", uid), { consentimientos: nuevaConstanciaConsentimiento() });

// ── ACCESO: copia de todos los datos de la persona ─────────────────────────
// Timestamps de Firestore → texto ISO, para que el archivo sea legible
const normalizar = (v) => {
  if (v?.toDate) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(normalizar);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, normalizar(x)]));
  }
  return v;
};

export const exportarMisDatos = async (uid) => {
  const [perfil, historial, asistencias, inscripciones] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDocs(collection(db, "users", uid, "historialPuntos")),
    getDocs(query(collection(db, "asistencias"), where("uid", "==", uid))),
    getDocs(query(collection(db, "inscripciones"), where("uid", "==", uid))),
  ]);
  const lista = (snap) => snap.docs.map((d) => normalizar({ id: d.id, ...d.data() }));
  return {
    exportadoEn: new Date().toISOString(),
    perfil: perfil.exists() ? normalizar(perfil.data()) : null,
    historialPuntos: lista(historial),
    asistencias: lista(asistencias),
    inscripciones: lista(inscripciones),
  };
};

// ── CANCELACIÓN: eliminar la propia cuenta y sus datos ─────────────────────
// Firestore permite 500 operaciones por lote
const borrarConsulta = async (consulta) => {
  const snap = await getDocs(consulta);
  for (let i = 0; i < snap.docs.length; i += 400) {
    const lote = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref));
    await lote.commit();
  }
};

export const eliminarMiCuenta = async (password) => {
  const user = auth.currentUser;
  if (!user?.email) throw { code: "auth/no-user" };

  // Firebase exige haber iniciado sesión hace poco para borrar la cuenta
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

  estadoEliminacion.enCurso = true;
  try {
    const uid = user.uid;
    const perfil = await getDoc(doc(db, "users", uid));
    const phone = perfil.exists() ? perfil.data().phone : null;

    await borrarConsulta(collection(db, "users", uid, "historialPuntos"));
    await borrarConsulta(query(collection(db, "asistencias"), where("uid", "==", uid)));
    await borrarConsulta(query(collection(db, "inscripciones"), where("uid", "==", uid)));
    if (phone) await deleteDoc(doc(db, "phoneIndex", phone));
    await deleteDoc(doc(db, "users", uid));
    await deleteUser(user);
  } catch (err) {
    estadoEliminacion.enCurso = false;
    throw err;
  }
  estadoEliminacion.enCurso = false;
};

// ── SOLICITUDES ARCO (oposición u otras) ───────────────────────────────────
export const TIPOS_SOLICITUD = [
  { key: "oposicion",     label: "Oposición: no quiero que se traten mis datos para algo" },
  { key: "rectificacion", label: "Rectificación: corregir un dato que no puedo editar" },
  { key: "acceso",        label: "Acceso: quiero saber qué datos tienen sobre mí" },
  { key: "cancelacion",   label: "Cancelación: quiero que borren mis datos" },
  { key: "otro",          label: "Otra consulta sobre mis datos" },
];

export const crearSolicitudARCO = async ({ tipo, detalle, perfil }) => {
  await addDoc(collection(db, "solicitudesARCO"), {
    uid: perfil.uid,
    nombre: `${perfil.name ?? ""} ${perfil.lastName ?? ""}`.trim(),
    email: perfil.email ?? "",
    tipo,
    detalle: detalle.trim(),
    estado: "pendiente",
    creadaEn: serverTimestamp(),
  });
};

// Solo admin
export const getSolicitudesARCO = async () => {
  const snap = await getDocs(
    query(collection(db, "solicitudesARCO"), orderBy("creadaEn", "desc"), limit(100))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const marcarSolicitudARCO = (id, estado) =>
  updateDoc(doc(db, "solicitudesARCO", id), { estado, atendidaEn: serverTimestamp() });
