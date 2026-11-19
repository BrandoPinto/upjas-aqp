/**
 * Cambia el correo de una cuenta cuando la persona perdió el acceso al anterior.
 * Conserva el mismo uid, así que no se pierden puntos, historial ni asistencias.
 * Después de cambiarlo, la persona usa "¿Olvidaste tu contraseña?" con el correo nuevo.
 *
 * Es GRATIS: corre en la computadora del administrador, no en un servidor.
 *
 * Requisitos (una sola vez):
 *   1. Firebase Console → Configuración del proyecto → Cuentas de servicio →
 *      "Generar nueva clave privada". Guarda el JSON FUERA del repositorio
 *      (esa llave da control total del proyecto; nunca la subas ni la compartas).
 *   2. npm install   (instala firebase-admin)
 *
 * Uso (sin --confirmar solo muestra qué haría, no cambia nada):
 *   node scripts/cambiarCorreo.js --key RUTA/llave.json --actual viejo@mail.com --nuevo nuevo@mail.com
 *   node scripts/cambiarCorreo.js --key RUTA/llave.json --uid UID --nuevo nuevo@mail.com --confirmar
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const arg = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const bandera = (nombre) => process.argv.includes(`--${nombre}`);

const llave    = arg("key");
const uidArg   = arg("uid");
const actual   = arg("actual")?.trim().toLowerCase();
const nuevo    = arg("nuevo")?.trim().toLowerCase();
const confirma = bandera("confirmar");

// Misma lógica que la app (src/services/authService.jsx):
// "brandopinto@gmail.com" → "br***o@gmail.com"
const ocultarCorreo = (email) => {
  const [local, dominio] = String(email ?? "").split("@");
  if (!local || !dominio) return "";
  if (local.length <= 3) return `${local[0]}***@${dominio}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${dominio}`;
};

const salir = (msg) => { console.error(`\nError: ${msg}\n`); process.exit(1); };

if (!llave || !nuevo || (!uidArg && !actual)) {
  salir("Uso: node scripts/cambiarCorreo.js --key RUTA/llave.json (--uid UID | --actual correo) --nuevo correo [--confirmar]");
}
if (!/\S+@\S+\.\S+/.test(nuevo)) salir("El correo nuevo no tiene un formato válido.");

initializeApp({ credential: cert(JSON.parse(readFileSync(llave, "utf8"))) });
const auth = getAuth();
const db   = getFirestore();

async function main() {
  const usuario = uidArg ? await auth.getUser(uidArg) : await auth.getUserByEmail(actual);

  // El correo nuevo no puede pertenecer ya a otra cuenta
  try {
    const existente = await auth.getUserByEmail(nuevo);
    if (existente.uid !== usuario.uid) {
      salir(`El correo ${nuevo} ya pertenece a otra cuenta (uid ${existente.uid}). Habría que fusionar cuentas, y eso no lo hace este script.`);
    }
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
  }

  // Un correo bloqueado por una eliminación previa no se puede reasignar sin que un admin lo decida
  if ((await db.doc(`usuariosBloqueados/${nuevo}`).get()).exists) {
    salir(`El correo ${nuevo} está en la lista de bloqueados (usuariosBloqueados). Quita el bloqueo manualmente si corresponde.`);
  }

  const perfilRef  = db.doc(`users/${usuario.uid}`);
  const perfilSnap = await perfilRef.get();
  if (!perfilSnap.exists) salir(`La cuenta ${usuario.uid} existe en Auth pero no tiene perfil en Firestore.`);
  const perfil = perfilSnap.data();

  console.log("\nCuenta encontrada:");
  console.log(`  uid       : ${usuario.uid}`);
  console.log(`  nombre    : ${perfil.name ?? ""} ${perfil.lastName ?? ""}`.trimEnd());
  console.log(`  código    : ${perfil.codigoJAS ?? "—"}   puntos: ${perfil.puntos ?? 0}`);
  console.log(`  correo    : ${usuario.email}  →  ${nuevo}`);

  if (!confirma) {
    console.log("\nNo se cambió nada. Revisa que sea la persona correcta y repite el comando con --confirmar.\n");
    return;
  }

  await auth.updateUser(usuario.uid, { email: nuevo, emailVerified: false });
  await perfilRef.update({ email: nuevo });
  if (perfil.phone) {
    await db.doc(`phoneIndex/${perfil.phone}`).set(
      { uid: usuario.uid, emailHint: ocultarCorreo(nuevo) },
      { merge: true }
    );
  }

  console.log("\n✓ Correo actualizado. Indícale a la persona que entre a «¿Olvidaste tu contraseña?» con el correo nuevo.\n");
}

main().catch((err) => salir(err.message));
