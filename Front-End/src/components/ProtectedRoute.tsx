import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Protects routes that require authentication (Dashboard, Lessons, etc.)
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useContext(AuthContext);

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Prevents logged-in users from accessing auth pages (Login, Register, etc.)
export const PublicOnlyRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useContext(AuthContext);

  if (auth?.token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
