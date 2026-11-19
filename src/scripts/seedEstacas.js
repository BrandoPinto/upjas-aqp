import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const data = [
  {
    id: "manuel-prado",
    nombre: "Manuel Prado",
    barrios: ["Alto Misti", "Ferroviarios", "Manuel Prado", "Mariano Melgar", "Miraflores", "15 de Agosto"],
  },
  {
    id: "hunter",
    nombre: "Hunter",
    barrios: ["Alcides Carrión", "Augusto Freyre", "Congata", "Hunter", "Palacio"],
  },
  {
    id: "central",
    nombre: "Central",
    barrios: ["Dolores", "La Campiña", "Lara", "Puerta Verde", "Villa el Golf"],
  },
  {
    id: "paucarpata",
    nombre: "Paucarpata",
    barrios: ["Cesar Vallejo", "Casa Blanca", "Ciudad Blanca", "Miguel Grau", "Nueva Alborada"],
  },
  {
    id: "umacollo",
    nombre: "Umacollo",
    barrios: ["Alto Libertad", "Carmen Alto", "Libertad", "Los Arces", "Pachacútec", "Primavera", "Umacollo", "Unión"],
  },
  {
    id: "selva-alegre",
    nombre: "Selva Alegre",
    barrios: ["Alto Selva Alegre", "Independencia", "Las Torres", "Porvenir", "Villa Hermoza"],
  },
  {
    id: "zamacola",
    nombre: "Zamácola",
    barrios: ["Belaunde", "Buenos Aires", "Bustamante", "Chachani", "Dean Valdivia", "Zamácola"],
  },
];

const toId = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

export const seedEstacas = async () => {
  try {
    for (const estaca of data) {
      await setDoc(doc(db, "estacas", estaca.id), { nombre: estaca.nombre });
      for (const barrio of estaca.barrios) {
        await setDoc(
          doc(db, "estacas", estaca.id, "barrios", toId(barrio)),
          { nombre: barrio }
        );
      }
    }
    console.log("🎉 Seed completo — ya puedes quitar el useEffect");
  } catch (err) {
    console.error("❌ Error:", err);
  }
};