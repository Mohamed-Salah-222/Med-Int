import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import UserMenu from "./UserMenu";
import { Shield } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  showAuth?: boolean; // Whether to show login/register or user menu
}

function Layout({ children, showAuth = true }: LayoutProps) {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="flex items-center space-x-3 cursor-pointer">
            <Shield className="w-8 h-8 text-[#7A9D96]" strokeWidth={2} />
            <span className="text-xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Inter, sans-serif" }}>
              Medical Interpreter Academy
            </span>
          </div>

          {showAuth && (
            <div className="flex items-center space-x-4">
              {!auth?.token ? (
                <>
                  <button onClick={() => navigate("/login")} className="text-[#2C2C2C] hover:text-[#7A9D96] font-semibold transition-colors">
                    Login
                  </button>
                  <button onClick={() => navigate("/register")} className="bg-[#7A9D96] text-white px-6 py-2.5 rounded-lg hover:bg-[#6A8D86] font-semibold transition-all shadow-sm hover:shadow-md">
                    Get Started
                  </button>
                </>
              ) : (
                <UserMenu userName={auth.user?.name || "User"} onLogout={auth.logout} />
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  );
}

export default Layout;
