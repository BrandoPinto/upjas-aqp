/**
 * Unifica los documentos de asistencia que ya existen.
 *
 * Antes, la confirmación desde la app guardaba "usuario_evento" y el escáner "evento_usuario":
 * la misma persona quedaba en DOS documentos y los reportes la mostraban duplicada. Además el
 * escáner marcaba como "confirmado" a quien solo fue escaneado.
 *
 * Este script deja UN documento por persona y evento, con id "evento_usuario":
 *   · une los datos de los documentos repetidos y borra los sobrantes
 *   · quita estado "confirmado" a quien nunca confirmó desde la app (solo lo escanearon)
 *
 * Es seguro repetirlo: si ya está todo unificado, no cambia nada.
 * Es GRATIS: corre en la computadora del administrador (misma llave de servicio que cambiarCorreo.js).
 *
 * Orden recomendado:
 *   1. Publicar primero la versión nueva de la app (ya escribe en el formato único).
 *   2. Correr este script. Sin --confirmar solo muestra el resumen.
 *
 * Uso:
 *   node scripts/unificarAsistencias.js --key RUTA/llave.json
 *   node scripts/unificarAsistencias.js --key RUTA/llave.json --confirmar
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { idAsistencia, fusionarAsistencias } from "../src/utils/asistencias.js";

const arg = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const llave    = arg("key");
const confirma = process.argv.includes("--confirmar");

const salir = (msg) => { console.error(`\nError: ${msg}\n`); process.exit(1); };
if (!llave) salir("Uso: node scripts/unificarAsistencias.js --key RUTA/llave.json [--confirmar]");

initializeApp({ credential: cert(JSON.parse(readFileSync(llave, "utf8"))) });
const db = getFirestore();

async function main() {
  const snap = await db.collection("asistencias").get();
  console.log(`\nDocumentos de asistencia: ${snap.size}`);

  // Se agrupa por persona + evento, sin fiarse del id del documento
  const grupos = new Map();
  const incompletos = [];
  for (const d of snap.docs) {
    const datos = d.data();
    if (!datos.eventoId || !datos.uid) { incompletos.push(d.id); continue; }
    const clave = `${datos.eventoId}\u0000${datos.uid}`;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push({ id: d.id, ...datos });
  }

  const cambios = [];
  const resumen = { renombrar: 0, fusionar: 0, corregirEstado: 0, sinCambios: 0 };

  for (const docs of grupos.values()) {
    const { eventoId, uid } = docs[0];
    const idCanonico = idAsistencia(eventoId, uid);
    const unido = fusionarAsistencias(docs);
    const actual = docs.find((d) => d.id === idCanonico);

    if (docs.length > 1) resumen.fusionar++;
    else if (!actual) resumen.renombrar++;
    else if (actual.estado !== unido.estado) resumen.corregirEstado++;
    else { resumen.sinCambios++; continue; }

    cambios.push({ idCanonico, unido, sobrantes: docs.filter((d) => d.id !== idCanonico).map((d) => d.id) });
  }

  console.log(`Personas-evento distintas : ${grupos.size}`);
  console.log(`  ya correctas            : ${resumen.sinCambios}`);
  console.log(`  a renombrar (1 doc)     : ${resumen.renombrar}`);
  console.log(`  a fusionar (2+ docs)    : ${resumen.fusionar}`);
  console.log(`  a corregir "confirmado" : ${resumen.corregirEstado}`);
  if (incompletos.length) {
    console.log(`  sin eventoId o uid      : ${incompletos.length} (se dejan como están): ${incompletos.slice(0, 5).join(", ")}${incompletos.length > 5 ? "…" : ""}`);
  }

  if (cambios.length === 0) {
    console.log("\nNada que unificar.\n");
    return;
  }
  if (!confirma) {
    console.log("\nNo se cambió nada. Revisa el resumen y repite el comando con --confirmar.\n");
    return;
  }

  // Firestore permite 500 operaciones por lote
  let operaciones = [];
  const vaciar = async () => {
    if (operaciones.length === 0) return;
    const lote = db.batch();
    operaciones.forEach((op) => op(lote));
    await lote.commit();
    operaciones = [];
  };
  for (const c of cambios) {
    // set() sin merge reemplaza el documento: así desaparece un "estado" que no corresponde
    operaciones.push((lote) => lote.set(db.collection("asistencias").doc(c.idCanonico), c.unido));
    for (const id of c.sobrantes) {
      operaciones.push((lote) => lote.delete(db.collection("asistencias").doc(id)));
    }
    if (operaciones.length >= 400) await vaciar();
  }
  await vaciar();

  console.log(`\n✓ Listo: ${cambios.length} grupos unificados.\n`);
}

main().catch((err) => salir(err.message));
