import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LayoutDashboard, UserCircle, LogOut, Settings } from "lucide-react";

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    auth?.logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isAdminOrSupervisor = auth?.user?.role === "Admin" || auth?.user?.role === "SuperVisor";

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-3 focus:outline-none">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] flex items-center justify-center text-white font-bold border-2 border-white shadow-md hover:scale-105 transition-transform">{getInitials(auth?.user?.name || "User")}</div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-[#E8E8E6] py-2 z-50 animate-fade-in">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-[#E8E8E6]">
            <p className="text-sm font-bold text-[#2C2C2C]">{auth?.user?.name}</p>
            <p className="text-xs text-[#6B6B6B] mt-1">{auth?.user?.email}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-semibold ${auth?.user?.role === "Admin" ? "bg-purple-100 text-purple-800" : auth?.user?.role === "SuperVisor" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{auth?.user?.role}</span>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                navigate("/dashboard");
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-[#2C2C2C] hover:bg-[#7A9D96]/10 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 mr-3 text-[#7A9D96]" />
              Dashboard
            </button>

            <button
              onClick={() => {
                navigate("/profile");
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-[#2C2C2C] hover:bg-[#7A9D96]/10 transition-colors"
            >
              <UserCircle className="w-4 h-4 mr-3 text-[#7A9D96]" />
              Profile
            </button>

            {/* Admin Panel - Only for Admin/SuperVisor */}
            {isAdminOrSupervisor && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-[#2C2C2C] hover:bg-purple-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-3 text-purple-600" />
                <span className="font-semibold text-purple-600">Admin Panel</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-[#E8E8E6] pt-1">
            <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
