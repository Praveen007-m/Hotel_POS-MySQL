import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Key, Menu } from "lucide-react";
import auth from "../../auth/axiosInstance";
import { useAuth } from "../../hooks/useAuth";

export default function Topbar({ onMenuClick }) {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // Clear token and user state
    localStorage.removeItem("token");
    setUser(null);
    window.location.replace("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const getRoleGradient = (role) => {
    const roleLower = role?.toLowerCase() || "";
    if (roleLower === "admin") return "from-purple-600 to-fuchsia-600";
    if (roleLower === "staff") return "from-blue-600 to-cyan-600";
    if (roleLower === "manager") return "from-orange-600 to-amber-600";
    return "from-gray-700 to-gray-900";
  };
  const isKitchen = user?.role === "kitchen";

  return (
    <div
      className={`
        fixed top-0 z-40
        ${isKitchen ? "w-full ml-0" : "w-full md:ml-64 md:w-[calc(100%-16rem)]"}
        bg-white/90 backdrop-blur-xl
        border-b border-gray-200/50 shadow-lg
        py-4 px-4 md:px-8 flex justify-between items-center
      `}
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {!isKitchen && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
        )}
        <div className="space-y-0.5 md:space-y-1">
          <p className="text-[10px] md:text-sm font-medium text-gray-500 flex items-center gap-1.5 md:gap-2">
            <span className="hidden xs:inline">Welcome back</span>
          </p>
          <div className="flex items-center gap-2 md:gap-3">
            <h2
              className={`text-sm md:text-xl font-bold capitalize bg-gradient-to-r ${getRoleGradient(user?.role)} bg-clip-text text-transparent`}
            >
              {user?.role}
            </h2>
            <div className="w-0.5 h-4 md:w-1 md:h-6 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
            <h2 className="text-sm md:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate max-w-[120px] md:max-w-none">
            Hotel Friday Inn
            </h2>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 transition-all duration-300 group"
        >
          <span className="hidden sm:inline text-sm text-gray-700 font-semibold group-hover:text-gray-900 transition-colors">
            {user?.name}
          </span>

          <div className="relative">
            <div
              className={`bg-gradient-to-br ${getRoleGradient(user?.role)} text-white w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl text-xs md:text-base font-bold shadow-lg hover:shadow-xl group-hover:scale-105 transition-all duration-300`}
            >
              {initials}
            </div>
          </div>

          <ChevronDown
            size={18}
            className={`text-gray-600 transition-all duration-300 group-hover:text-gray-900 ${open ? "rotate-180" : ""
              }`}
          />
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-[#0A1A2F] to-[#13294B] text-white rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-slideDown">
            {/* User info header */}
            <div className="px-5 py-4 bg-white/5 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleGradient(user?.role)} flex items-center justify-center text-white font-bold shadow-lg`}
                >
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-xs text-white/70 font-medium">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2 px-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm 
                          hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 transition-all duration-300 group rounded-xl"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-300">
                  <LogOut size={16} className="text-white" />
                </div>
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
