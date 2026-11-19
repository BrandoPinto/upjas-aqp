import {
  collection, doc, getDoc, getDocs, updateDoc, setDoc,
  addDoc, deleteDoc, serverTimestamp, query, increment,
  orderBy, where, runTransaction, limit, startAfter,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getConfigPuntos, obtenerDescripcion } from "./puntosService";

// ── USUARIOS ────────────────────────────────────────────────────

export const getTodosUsuarios = async () => {
  const snap = await getDocs(
    query(collection(db, "users"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getUsuariosPagina = async (cursor = null, tamano = 20) => {
  const q = cursor
    ? query(collection(db, "users"), orderBy("createdAt", "desc"), startAfter(cursor), limit(tamano))
    : query(collection(db, "users"), orderBy("createdAt", "desc"), limit(tamano));
  const snap = await getDocs(q);
  return {
    usuarios: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snap.docs[snap.docs.length - 1] ?? null,
    hayMas: snap.docs.length === tamano,
  };
};

// Top de usuarios con más puntos. Una sola lectura acotada (no crece con la
// cantidad total de usuarios) — la paginación en la UI se hace en memoria.
export const getTopUsuariosPuntos = async (topN = 20) => {
  const snap = await getDocs(
    query(collection(db, "users"), orderBy("puntos", "desc"), limit(topN))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getMaestros = async () => {
  const snap = await getDocs(
    query(collection(db, "users"), where("roles", "array-contains", "maestro"))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
};

// ── ROLES ────────────────────────────────────────────────────────

export const asignarRol = async (uid, rol) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const roles = snap.data()?.roles ?? [];
  if (!roles.includes(rol)) {
    await updateDoc(ref, { roles: [...roles, rol] });
  }
};

export const quitarRol = async (uid, rol) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const roles = (snap.data()?.roles ?? []).filter((r) => r !== rol);
  await updateDoc(ref, { roles });
};

// ── PUNTOS (admin) ───────────────────────────────────────────────

export const otorgarPuntosAdmin = async ({ uidReceptor, uidAdmin, tipo }) => {
  const config = await getConfigPuntos();
  const valor = config[tipo];
  if (!valor) throw new Error("Tipo inválido");

  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", uidReceptor);
    const snap = await tx.get(userRef);
    const puntosActuales = snap.data()?.puntos ?? 0;
    tx.update(userRef, { puntos: puntosActuales + valor });

    const histRef = doc(collection(db, "users", uidReceptor, "historialPuntos"));
    tx.set(histRef, {
      tipo,
      valor,
      otorgadoPor: uidAdmin,
      rolOtorgante: "admin",
      fecha: serverTimestamp(),
      descripcion: obtenerDescripcion(tipo),
    });
  });

  return valor;
};

// ── CONFIG PUNTOS ────────────────────────────────────────────────

export const actualizarConfigPuntos = async (config) => {
  await updateDoc(doc(db, "config", "puntos"), config);
};

// ── CATEGORÍAS EVENTOS ───────────────────────────────────────────

export const getCategorias = async () => {
  const snap = await getDocs(
    query(collection(db, "categoriasEventos"), orderBy("nombre"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const crearCategoria = async (nombre) => {
  const ref = await addDoc(collection(db, "categoriasEventos"), { nombre });
  return ref.id;
};

export const eliminarCategoria = async (id) => {
  await deleteDoc(doc(db, "categoriasEventos", id));
};

// ── CLASES ───────────────────────────────────────────────────────

export const getClases = async () => {
  const snap = await getDocs(
    query(collection(db, "clases"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const crearClase = async (data) => {
  const ref = await addDoc(collection(db, "clases"), {
    ...data,
    inscritos: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const actualizarClase = async (id, data) => {
  await updateDoc(doc(db, "clases", id), data);
};

export const eliminarClase = async (id) => {
  await deleteDoc(doc(db, "clases", id));
};

// ── EVENTOS ──────────────────────────────────────────────────────

export const getEventos = async () => {
  const snap = await getDocs(
    query(collection(db, "eventos"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getEventosPorTipo = async (tipo) => {
  const snap = await getDocs(
    query(collection(db, "eventos"), where("tipoPuntos", "==", tipo))
  );
  const eventos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return eventos.sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
};

export const crearEvento = async (data) => {
  const ref = await addDoc(collection(db, "eventos"), {
    ...data,
    confirmados: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const actualizarEvento = async (id, data) => {
  await updateDoc(doc(db, "eventos", id), data);
};

export const eliminarEvento = async (id) => {
  await deleteDoc(doc(db, "eventos", id));
};

// ── HISTORIAL PUNTOS ────────────────────────────────────────────

export const getHistorialPuntos = async (uid, cursorDoc = null) => {
  const q = cursorDoc
    ? query(collection(db, "users", uid, "historialPuntos"), orderBy("fecha", "desc"), startAfter(cursorDoc), limit(11))
    : query(collection(db, "users", uid, "historialPuntos"), orderBy("fecha", "desc"), limit(11));
  const snap = await getDocs(q);
  const hayMas = snap.docs.length === 11;
  const docs = hayMas ? snap.docs.slice(0, 10) : snap.docs;
  return {
    entradas:  docs.map((d) => ({ id: d.id, ...d.data() })),
    cursorDoc: docs[docs.length - 1] ?? null,
    hayMas,
  };
};

export const eliminarEntradaHistorial = async (uid, historialId, valor) => {
  await deleteDoc(doc(db, "users", uid, "historialPuntos", historialId));
  await updateDoc(doc(db, "users", uid), { puntos: increment(-valor) });
};

// ── ELIMINAR USUARIO ─────────────────────────────────────────────

export const eliminarUsuario = async (uid) => {
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) throw new Error("Usuario no encontrado.");
  const { email } = userSnap.data();

  await deleteDoc(doc(db, "users", uid));

  // Intentar bloquear el correo; si falla por permisos no interrumpe el flujo
  if (email) {
    setDoc(doc(db, "usuariosBloqueados", email.toLowerCase()), {
      email: email.toLowerCase(),
      uid,
      bloqueadoEn: serverTimestamp(),
    }).catch(() => {});
  }
};