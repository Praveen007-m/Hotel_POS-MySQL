import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  CalendarDays,
  Users,
  CookingPot,
  Receipt,
  Puzzle,
  IndianRupee,
  UserCog,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

  if (user?.role === "kitchen") {
    return null;
  }
  const isAdmin = user?.role === "admin";

  /* =========================
     ROLE BASED MENU
  ========================= */
  let menuItems = [
    { name: "Dashboard", to: "/", icon: LayoutDashboard },
    { name: "Rooms", to: "/rooms", icon: BedDouble },
    { name: "Customers", to: "/customers", icon: Users },
    { name: "Booking", to: "/booking", icon: CalendarCheck },
    { name: "Kitchen", to: "/kitchen", icon: CookingPot },
    { name: "Calendar", to: "/calendar", icon: CalendarDays },
    { name: "Billing", to: "/billing", icon: Receipt },
    { name: "Expense Tracker", to: "/expense", icon: IndianRupee },
  ];

  // 🔐 ADMIN ONLY
  if (isAdmin) {
    menuItems.push(
      { name: "Staff Management", to: "/staffs", icon: UserCog },
      { name: "Add-Ons", to: "/addons", icon: Puzzle },
      { name: "Finance", to: "/finance", icon: TrendingUp },
    );
  }

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 inset-y-0 w-64 bg-gradient-to-b from-[#0A1A2F] via-[#0d2340] to-[#0A1A2F] text-white flex flex-col shadow-2xl z-50 border-r border-white/5 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* LOGO */}
        <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
                            <span className="text-white">Hotel</span>

              <span className="text-white ml-1">Friday</span>
              <span className="ml-1 bg-linear-to-r from-[#E8C878] to-yellow-400 bg-clip-text text-transparent">
                Inn
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              Hotel Management System
            </p>
          </div>
          {/* MOBILE CLOSE BUTTON */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Close Sidebar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {menuItems.map(({ name, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#E8C878] to-yellow-400 text-[#0A1A2F] shadow-lg shadow-yellow-500/20"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500" />
                    )}

                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#0A1A2F] rounded-r-full" />
                    )}

                    <Icon
                      className={`relative z-10 w-5 h-5 transition-transform duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />

                    <span className="relative z-10 truncate">{name}</span>

                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* ADMIN LABEL */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Admin Tools
              </p>
            </div>
          )}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-center">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              © Hotel Friday Inn 2026
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
