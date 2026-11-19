/**
 * Script ONE-TIME: da 5 pts (actividadGrande) a todos los usuarios con 0 puntos.
 * Uso: node scripts/darPuntos.js TU_EMAIL TU_CONTRASEÑA
 */

import { initializeApp }          from "firebase/app";
import { getAuth, signInWithEmailAndPassword, setPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyA56x3sln6J4BijEQcMbqwlyYz_vHdJ7gY",
  authDomain:        "irappp.firebaseapp.com",
  projectId:         "irappp",
  storageBucket:     "irappp.firebasestorage.app",
  messagingSenderId: "1032956343558",
  appId:             "1:1032956343558:web:f173c9459835b4fb061a87",
};

const PUNTOS = 5;
const TIPO   = "actividadGrande";

const [,, email, password] = process.argv;
if (!email || !password) {
  console.error("Uso: node scripts/darPuntos.js EMAIL CONTRASEÑA");
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

async function main() {
  await setPersistence(auth, inMemoryPersistence);

  console.log("Iniciando sesión...");
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  console.log(`✓ Sesión iniciada: ${user.email}\n`);

  console.log("Leyendo colección users...");
  const snap  = await getDocs(collection(db, "users"));
  const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const cero  = todos.filter(u => (u.puntos ?? 0) === 0);

  console.log(`Total usuarios  : ${todos.length}`);
  console.log(`Con 0 puntos    : ${cero.length}\n`);

  if (cero.length === 0) {
    console.log("No hay usuarios con 0 puntos. Nada que hacer.");
    process.exit(0);
  }

  let ok = 0;
  for (const u of cero) {
    const nombre = `${u.name ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id;
    try {
      await updateDoc(doc(db, "users", u.id), { puntos: PUNTOS });
      await addDoc(collection(db, "users", u.id, "historialPuntos"), {
        tipo:         TIPO,
        valor:        PUNTOS,
        otorgadoPor:  user.uid,
        rolOtorgante: "admin",
        descripcion:  "Actividad Grande",
        fecha:        serverTimestamp(),
      });
      console.log(`  ✓ ${nombre}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${nombre}: ${err.message}`);
    }
  }

  console.log(`\nListo: ${ok}/${cero.length} usuarios actualizados (+${PUNTOS} pts - actividadGrande).`);
  process.exit(0);
}

main().catch(err => {
  console.error("\nError:", err.message);
  process.exit(1);
});
