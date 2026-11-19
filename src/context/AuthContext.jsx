import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { estadoEliminacion } from "../services/privacidadService";
import { mostrarToast, mensajeDeError } from "../services/toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubProfile) unsubProfile();

      if (firebaseUser) {
        let tuvoPerfil = false; // rastrea si alguna vez existió el perfil
        setUser(firebaseUser);
        unsubProfile = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              tuvoPerfil = true;
              setProfile(snap.data());
              setLoading(false);
            } else if (tuvoPerfil) {
              // Perfil existía y fue eliminado → cerrar sesión
              // (salvo que la propia persona esté borrando su cuenta: ahí se cierra al terminar)
              if (!estadoEliminacion.enCurso) signOut(auth);
            } else {
              // Perfil aún no existe (registro en curso) → esperar
              setProfile(null);
              setLoading(false);
            }
          },
          (err) => {
            // Al cerrar sesión el listener puede fallar de forma esperada: solo se avisa si sigue la sesión
            if (auth.currentUser) {
              mostrarToast(mensajeDeError(err, "No se pudo cargar tu perfil. Revisa tu conexión e intenta de nuevo."));
            }
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Patrón habitual de contexto: el Provider y su hook viven juntos.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}