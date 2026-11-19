import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  doc, getDoc, updateDoc,
  runTransaction, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

const AUTH_ERRORS = {
  "auth/user-not-found":       "No existe una cuenta con ese correo.",
  "auth/wrong-password":       "Contraseña incorrecta.",
  "auth/invalid-credential":   "Correo o contraseña incorrectos.",
  "auth/too-many-requests":    "Demasiados intentos. Espera un momento.",
  "auth/email-already-in-use": "Ese correo ya tiene una cuenta.",
  "auth/weak-password":        "Mínimo 6 caracteres.",
  "auth/invalid-email":        "Formato de correo inválido.",
  "auth/email-bloqueado":      "Este correo no puede registrarse en la plataforma.",
};

export const getAuthError = (code) =>
  AUTH_ERRORS[code] || "Ocurrió un error. Intenta de nuevo.";

// ── PISTA DEL CORREO ───────────────────────────────────────────
// "brandopinto@gmail.com" → "br***o@gmail.com". Solo se guarda esta versión
// oculta junto al celular (phoneIndex) para poder ayudar a quien olvidó con qué
// correo se registró, sin exponer el correo completo. Si el nombre es corto
// (3 letras o menos) solo se muestra la primera, para no revelarlo casi entero.
export const ocultarCorreo = (email) => {
  const [local, dominio] = String(email ?? "").split("@");
  if (!local || !dominio) return "";
  if (local.length <= 3) return `${local[0]}***@${dominio}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${dominio}`;
};

// Devuelve la pista del correo asociada a un celular, o null si no hay cuenta
export const getPistaCorreo = async (phone) => {
  if (!/^\d{9}$/.test(phone)) throw { code: "phone/invalid" };
  const snap = await getDoc(doc(db, "phoneIndex", phone));
  return snap.exists() ? (snap.data().emailHint ?? "") : null;
};

// ── ÚLTIMO CORREO USADO (solo en este dispositivo) ─────────────
const CLAVE_ULTIMO_CORREO = "upjas:ultimoCorreo";

export const getUltimoCorreo = () => {
  try { return localStorage.getItem(CLAVE_ULTIMO_CORREO) ?? ""; }
  catch { return ""; }
};

export const guardarUltimoCorreo = (email) => {
  try { localStorage.setItem(CLAVE_ULTIMO_CORREO, email); }
  catch { /* sin acceso a localStorage: simplemente no se recuerda */ }
};

// ── REGISTRO ──────────────────────────────────────────────────
export const registerUser = async ({
  email, password, name, lastName,
  phone, birthDate, gender, relation,
  stateValue, parish,
}) => {
  // 1. Verificar que el correo no esté bloqueado por eliminación previa
  const bloqueadoSnap = await getDoc(doc(db, "usuariosBloqueados", email.toLowerCase()));
  if (bloqueadoSnap.exists()) throw { code: "auth/email-bloqueado" };

  // 2. Verificar celular único antes de crear la cuenta (usuario aún no autenticado)
  const phoneSnap = await getDoc(doc(db, "phoneIndex", phone));
  if (phoneSnap.exists()) throw { code: "phone/already-in-use" };

  // 2. Crear cuenta en Firebase Auth
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await user.getIdToken(); // Asegurar que el token esté listo antes de Firestore

  try {
    // 3. Transacción: generar codigoJAS + reclamar celular + guardar perfil
    await runTransaction(db, async (tx) => {
      // Verificar de nuevo dentro de la transacción (evita race condition)
      const phoneRef    = doc(db, "phoneIndex", phone);
      const phoneCheck  = await tx.get(phoneRef);
      if (phoneCheck.exists() && phoneCheck.data().uid !== user.uid) {
        throw { code: "phone/already-in-use" };
      }

      // Generar codigoJAS
      const contadorRef  = doc(db, "config", "contadorJAS");
      const contadorSnap = await tx.get(contadorRef);
      const numero       = contadorSnap.exists() ? contadorSnap.data().ultimo + 1 : 1;
      const codigoJAS    = `JAS-${String(numero).padStart(3, "0")}`;

      // Escribir todo atómicamente
      tx.set(contadorRef, { ultimo: numero });
      tx.set(phoneRef, { uid: user.uid, emailHint: ocultarCorreo(email) });
      tx.set(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        name,
        lastName,
        phone,
        birthDate,
        gender,
        relation,
        ...(relation === "miembro" && { stateValue, parish }),
        role: "usuario",
        roles: [],
        codigoJAS,
        puntos: 0,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    // Revertir cuenta de Auth si falló el guardado en Firestore
    await user.delete();
    throw err;
  }

  return user;
};

// Cuentas creadas antes de esta función no tienen la pista en phoneIndex:
// se completa sola al iniciar sesión. Nunca bloquea el login si falla.
const asegurarPistaCorreo = async ({ uid, phone, email }) => {
  try {
    if (!phone || !email) return;
    const ref  = doc(db, "phoneIndex", phone);
    const snap = await getDoc(ref);
    const hint = ocultarCorreo(email);
    if (snap.exists() && snap.data().uid === uid && snap.data().emailHint !== hint) {
      await updateDoc(ref, { emailHint: hint });
    }
  } catch { /* la pista es opcional */ }
};

// ── LOGIN ──────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) {
    await signOut(auth);
    throw { code: "auth/user-not-found" };
  }
  const profile = snap.data();
  guardarUltimoCorreo(email);
  await asegurarPistaCorreo(profile);
  return { user, profile };
};

// ── RECUPERAR CONTRASEÑA ───────────────────────────────────────
export const resetPassword = (email) => {
  auth.languageCode = "es";
  return sendPasswordResetEmail(auth, email, {
    url: "https://upjas-aqp.web.app/login",
    handleCodeInApp: false,
  });
};

// ── CERRAR SESIÓN ──────────────────────────────────────────────
export const logoutUser = () => signOut(auth);

// ── OBTENER PERFIL ─────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

// ── ACTUALIZAR PERFIL ──────────────────────────────────────────
export const updateUserProfile = async (uid, { name, lastName, phone, birthDate, gender, relation, stateValue, parish }) => {
  await runTransaction(db, async (tx) => {
    const userRef  = doc(db, "users", uid);
    const userSnap = await tx.get(userRef);
    const oldPhone = userSnap.exists() ? userSnap.data().phone : null;

    // Verificar celular único solo si cambió
    if (phone !== oldPhone) {
      const phoneRef   = doc(db, "phoneIndex", phone);
      const phoneCheck = await tx.get(phoneRef);
      if (phoneCheck.exists() && phoneCheck.data().uid !== uid) {
        throw { code: "phone/already-in-use" };
      }
      // Liberar número anterior y reclamar el nuevo
      if (oldPhone) tx.delete(doc(db, "phoneIndex", oldPhone));
      tx.set(doc(db, "phoneIndex", phone), {
        uid,
        emailHint: ocultarCorreo(userSnap.data()?.email),
      });
    }

    const data = { name, lastName, phone, birthDate, gender, relation };
    if (relation === "miembro") {
      data.stateValue = stateValue;
      data.parish = parish;
    } else {
      data.stateValue = null;
      data.parish = null;
    }
    tx.update(userRef, data);
  });
};
