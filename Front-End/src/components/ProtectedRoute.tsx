import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStudent?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireStudent = true, requireAdmin = false }: ProtectedRouteProps) => {
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-xl text-[#6B6B6B]">Loading...</div>
      </div>
    );
  }

  if (!auth?.token) {
    return <Navigate to="/login" />;
  }

  // Check admin requirement
  if (requireAdmin) {
    if (auth.user?.role !== "Admin" && auth.user?.role !== "SuperVisor") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Access Denied</h2>
            <p className="text-[#6B6B6B] mb-6">You need admin privileges to access this page.</p>
            <button onClick={() => window.history.back()} className="bg-[#7A9D96] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all">
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check student requirement
  if (requireStudent) {
    if (auth.user && auth.user.role === "User") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="max-w-md text-center bg-white rounded-2xl p-8 border-2 border-[#E8E8E6] shadow-lg">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">Subscription Required</h2>
            <p className="text-[#6B6B6B] mb-6">You need to subscribe to access the course content. Enroll now to start learning!</p>
            <button onClick={() => (window.location.href = "/course")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all w-full">
              View Course & Enroll
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-xl text-[#6B6B6B]">Loading...</div>
      </div>
    );
  }

  if (auth?.token) {
    // Redirect based on role
    if (auth.user?.role === "Admin" || auth.user?.role === "SuperVisor") {
      return <Navigate to="/admin" />;
    } else if (auth.user?.role === "Student") {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/course" />;
    }
  }

  return <>{children}</>;
};
