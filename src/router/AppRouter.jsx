import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { portalesDisponibles, guardarUltimoPortal, rutaInicial } from "../constants/portales";

import LoginPage from "../pages/auth/LoginPage";
import HomePage from "../pages/user/HomePage";
import MaestroDashboard from "../pages/maestro/MaestroDashboard";
import LiderDashboard from "../pages/lider/LiderDashboard";import AdminDashboard from "../pages/admin/AdminDashboard";
import LoadingScreen from "../components/shared/LoadingScreen";

// Solo para no autenticados — si ya hay sesión va al último portal usado (o a "/")
function PublicRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to={rutaInicial(profile)} replace />;
}

// Recuerda el último portal visitado para llevar ahí a la persona en su próximo inicio de sesión
function RecordarPortal() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    if (profile && portalesDisponibles(profile).some((p) => p.path === pathname)) {
      guardarUltimoPortal(profile.uid, pathname);
    }
  }, [profile, pathname]);
  return null;
}

// Solo para autenticados
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

// Solo para un rol específico
function RoleRoute({ children, role }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  const tieneRol =
    profile?.roles?.includes(role) ||
    profile?.roles?.includes("admin");
  return tieneRol ? children : <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <RecordarPortal />
      <Routes>
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/"
          element={<PrivateRoute><HomePage /></PrivateRoute>}
        />
        <Route
          path="/maestro"
          element={
            <PrivateRoute>
              <RoleRoute role="maestro"><MaestroDashboard /></RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/lider"
          element={
            <PrivateRoute>
              <RoleRoute role="lider"><LiderDashboard /></RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <RoleRoute role="admin"><AdminDashboard /></RoleRoute>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}