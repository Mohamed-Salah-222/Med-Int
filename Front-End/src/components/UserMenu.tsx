import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, LayoutDashboard, UserCircle } from "lucide-react";

interface UserMenuProps {
  userName: string;
  onLogout: () => void;
}

function UserMenu({ userName, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full border-2 border-[#7A9D96] hover:border-[#6A8D86] flex items-center justify-center bg-[#7A9D96]/10 transition-all hover:bg-[#7A9D96]/20">
        <span className="text-[#7A9D96] font-semibold text-sm">{getInitials(userName)}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#E8E8E6] py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[#E8E8E6]">
            <p className="text-sm font-semibold text-[#2C2C2C]">{userName}</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Student Account</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                navigate("/dashboard");
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#7A9D96]/5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#6B6B6B]" />
              <span className="text-sm text-[#2C2C2C] font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => {
                navigate("/profile");
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#7A9D96]/5 transition-colors"
            >
              <UserCircle className="w-4 h-4 text-[#6B6B6B]" />
              <span className="text-sm text-[#2C2C2C] font-medium">Profile</span>
            </button>

            <div className="border-t border-[#E8E8E6] my-1"></div>

            <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
