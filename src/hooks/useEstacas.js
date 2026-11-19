import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Caché de módulo: evita re-lecturas en remounts y formularios repetidos
let _estacasCache = null;
const _barriosCache = {}; // { [estacaId]: barrios[] }

export function useEstacas() {
  const [estacas, setEstacas] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [loadingEstacas, setLoadingEstacas] = useState(true);
  const [loadingBarrios, setLoadingBarrios] = useState(false);

  useEffect(() => {
    // Caché hit: no leer Firestore
    if (_estacasCache !== null) {
      setEstacas(_estacasCache);
      setLoadingEstacas(false);
      return;
    }
    const fetchEstacas = async () => {
      try {
        const snap = await getDocs(collection(db, "estacas"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        _estacasCache = list;
        setEstacas(list);
      } catch (err) {
        console.error("Error cargando estacas:", err);
      } finally {
        setLoadingEstacas(false);
      }
    };
    fetchEstacas();
  }, []);

  // Cargar barrios cuando se selecciona una estaca (con caché por estacaId)
  const fetchBarrios = async (estacaId) => {
    if (!estacaId) { setBarrios([]); return; }

    // Caché hit: no leer Firestore
    if (_barriosCache[estacaId]) {
      setBarrios(_barriosCache[estacaId]);
      return;
    }

    setLoadingBarrios(true);
    try {
      const snap = await getDocs(collection(db, "estacas", estacaId, "barrios"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      _barriosCache[estacaId] = list;
      setBarrios(list);
    } catch (err) {
      console.error("Error cargando barrios:", err);
    } finally {
      setLoadingBarrios(false);
    }
  };

  return { estacas, barrios, loadingEstacas, loadingBarrios, fetchBarrios };
}