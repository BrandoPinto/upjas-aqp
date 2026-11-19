import AppRouter from "./router/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import Toaster from "./components/shared/Toaster";

export default function App() {
  return (
    <>
      {/* Fuera del ErrorBoundary: los avisos siguen funcionando aunque la pantalla falle */}
      <Toaster />
      <ErrorBoundary pantallaCompleta>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ErrorBoundary>
    </>
  );
}
