import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { logout, getUserEmail } from "../utils/auth";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userEmail = getUserEmail();

  const navItems = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: "dashboard",
    },
    {
      label: "Lead Management",
      path: "/admin/leads",
      icon: "group",
    },
    {
      label: "Quote Management",
      path: "/admin/quotes",
      icon: "request_quote",
    },
    {
      label: "Service & AMC",
      path: "/admin/service-amc",
      icon: "build",
    },
    {
      label: "Service Requests",
      path: "/admin/service-requests",
      icon: "support_agent",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          MOBILE HEADER
      ========================== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(!sidebarOpen)
            }
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined">
              menu
            </span>
          </button>

          <div>
            <div className="font-bold tracking-wide text-slate-900">
              SKYTECH
            </div>

            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              Admin Panel
            </div>
          </div>

        </div>

        <button
          type="button"
          onClick={logout}
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined">
            logout
          </span>
        </button>

      </header>

      {/* =========================
          MOBILE OVERLAY
      ========================== */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
        />
      )}

      {/* =========================
          SIDEBAR
      ========================== */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          h-screen
          w-64
          bg-slate-900
          text-white
          flex
          flex-col
          transform
          transition-transform
          duration-200
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Logo */}
        <div className="h-20 px-6 flex items-center border-b border-white/10">

          <div>
            <div className="text-xl font-bold tracking-wider">
              SKYTECH
            </div>

            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-1">
              Digital Power Platform
            </div>
          </div>

        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">

          <p className="px-3 mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Administration
          </p>

          <div className="space-y-1">

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() =>
                  setSidebarOpen(false)
                }
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `
                    flex
                    items-center
                    gap-3
                    px-3
                    py-3
                    rounded-lg
                    text-sm
                    transition-colors
                    ${
                      isActive
                        ? "bg-white text-slate-900 font-semibold"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }
                  `
                }
              >

                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>

                <span>{item.label}</span>

              </NavLink>
            ))}

          </div>

        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">

          <div className="px-3 py-3 mb-2 rounded-lg bg-white/5">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">
                  admin_panel_settings
                </span>
              </div>

              <div className="min-w-0">

                <p className="text-sm font-medium truncate">
                  Administrator
                </p>

                <p className="text-xs text-slate-400 truncate">
                  {userEmail || "Admin Account"}
                </p>

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >

            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>

            <span>Logout</span>

          </button>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">

        <div className="min-h-screen">
          <Outlet />
        </div>

      </main>

    </div>
  );
}