import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Shield, LogOut, LayoutDashboard, User, Settings } from "lucide-react";
import GlossaryTooltip from "./GlossaryTooltip";

interface LayoutProps {
  children: React.ReactNode;
  showAuth?: boolean;
}

function Layout({ children, showAuth = true }: LayoutProps) {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
      navigate("/");
    }
  };

  const isStudent = auth?.user && auth.user.role === "Student";
  const isAdmin = auth?.user && (auth.user.role === "Admin" || auth.user.role === "SuperVisor");
  const isUser = auth?.user && auth.user.role === "User";

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
            <div className="flex items-center space-x-2">
              {!auth?.token ? (
                <>
                  <button onClick={() => navigate("/login")} className="text-[#2C2C2C] hover:text-[#7A9D96] font-semibold transition-colors px-4 py-2">
                    Login
                  </button>
                  <button onClick={() => navigate("/register")} className="bg-[#7A9D96] text-white px-6 py-2.5 rounded-lg hover:bg-[#6A8D86] font-semibold transition-all shadow-sm hover:shadow-md">
                    Get Started
                  </button>
                </>
              ) : (
                <>
                  {/* Dashboard Link - Only for Students and Admins */}
                  {!isUser && (
                    <button onClick={() => navigate("/dashboard")} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-[#2C2C2C] hover:bg-[#7A9D96]/10 hover:text-[#7A9D96] font-semibold transition-all">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                  )}

                  {/* Course Link - For Users who aren't enrolled yet */}
                  {isUser && (
                    <button onClick={() => navigate("/course")} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-[#2C2C2C] hover:bg-[#7A9D96]/10 hover:text-[#7A9D96] font-semibold transition-all">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>View Course</span>
                    </button>
                  )}

                  {/* Admin Panel Link - Only for Admin/SuperVisor */}
                  {isAdmin && (
                    <button onClick={() => navigate("/admin")} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-[#2C2C2C] hover:bg-[#7A9D96]/10 hover:text-[#7A9D96] font-semibold transition-all">
                      <Settings className="w-4 h-4" />
                      <span>Admin</span>
                    </button>
                  )}

                  {/* Logout Button */}
                  <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-all">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <div className="min-h-[calc(100vh-73px)]">{children}</div>
      <GlossaryTooltip />
    </div>
  );
}

export default Layout;
