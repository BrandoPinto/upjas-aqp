import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const seedConfig = async () => {
  await setDoc(doc(db, "config", "puntos"), {
    asistencia:       1,
    actividadPequena: 3,
    actividadGrande:  5,
    invitacion:       2,
    plus:             10,
  });
  console.log("✅ Config de puntos guardada");
};