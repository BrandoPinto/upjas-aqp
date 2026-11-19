import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyA56x3sln6J4BijEQcMbqwlyYz_vHdJ7gY",
  authDomain:        "irappp.firebaseapp.com",
  projectId:         "irappp",
  storageBucket:     "irappp.firebasestorage.app",
  messagingSenderId: "1032956343558",
  appId:             "1:1032956343558:web:f173c9459835b4fb061a87",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;