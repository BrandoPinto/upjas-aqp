// Script de un solo uso para generar los íconos PWA a partir de public/upjas.png
// Ejecutar con: node scripts/genIcons.js
import path from "path";
import { fileURLToPath } from "url";
import { Jimp } from "jimp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "public", "upjas.png");
const OUT = (name) => path.join(__dirname, "..", "public", name);

async function main() {
  const src = await Jimp.read(SRC);
  const bg = src.getPixelColor(2, 2); // color de fondo (esquina), para el relleno del maskable

  // Íconos "any" — el logo a pantalla completa, tal como está hoy (Android + iOS lo escalan sin recortar)
  await src.clone().resize({ w: 192, h: 192 }).write(OUT("upjas-192.png"));
  await src.clone().resize({ w: 512, h: 512 }).write(OUT("upjas-512.png"));
  await src.clone().resize({ w: 180, h: 180 }).write(OUT("apple-touch-icon.png"));

  // Ícono "maskable" — Android recorta al 80% central, así que el logo va más chico
  // y centrado sobre un lienzo del mismo color de fondo (zona segura del ícono).
  const CANVAS = 512;
  const SCALE = 0.7; // deja ~15% de margen por lado
  const inner = Math.round(CANVAS * SCALE);

  const maskable = new Jimp({ width: CANVAS, height: CANVAS, color: bg });
  const logo = src.clone().resize({ w: inner, h: inner });
  const offset = Math.round((CANVAS - inner) / 2);
  maskable.composite(logo, offset, offset);
  await maskable.write(OUT("upjas-maskable.png"));

  console.log("Íconos generados en /public");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
