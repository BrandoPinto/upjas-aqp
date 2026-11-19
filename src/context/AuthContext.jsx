import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

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
              signOut(auth);
            } else {
              // Perfil aún no existe (registro en curso) → esperar
              setProfile(null);
              setLoading(false);
            }
          },
          () => {
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

export function useAuth() {
  return useContext(AuthContext);
}