import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../utils/auth";

/* ============================================================
   ICONS
   Inline SVG icons are used instead of Material Symbols so
   icon names can never appear as visible text.
   ============================================================ */

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "leads":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "quotes":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );

    case "service":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4.8 4.8 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a4.8 4.8 0 0 0 6.4-6.4l-3.1 3.1-3.1-3.1z" />
        </svg>
      );

    case "support":
      return (
        <svg {...common}>
          <path d="M4 13a8 8 0 0 1 16 0" />
          <path d="M4 13v4a2 2 0 0 0 2 2h1v-6H4z" />
          <path d="M20 13v4a2 2 0 0 1-2 2h-1v-6h3z" />
          <path d="M12 21h2" />
        </svg>
      );

    case "inventory":
      return (
        <svg {...common}>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
          <path d="M12 11v10" />
        </svg>
      );

    case "analytics":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h17" />
          <path d="M8 16v-5" />
          <path d="M12 16V7" />
          <path d="M16 16v-3" />
          <path d="M20 16V4" />
        </svg>
      );

    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.9 1.9-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.02 1.56V22h-2.68v-.08a1.7 1.7 0 0 0-1.02-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.9-1.9.06-.06A1.7 1.7 0 0 0 7.4 15a1.7 1.7 0 0 0-1.56-1.02H5.75v-2.68h.09A1.7 1.7 0 0 0 7.4 10.3a1.7 1.7 0 0 0-.34-1.88L7 8.36l1.9-1.9.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.02-1.56V5h2.68v.3a1.7 1.7 0 0 0 1.02 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.9 1.9-.06.06A1.7 1.7 0 0 0 19.4 10.3a1.7 1.7 0 0 0 1.56 1.02H21v2.68h-.04A1.7 1.7 0 0 0 19.4 15z" />
        </svg>
      );

    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.3 2.3 0 1 1 4.3 1.15c-.65.9-2.1 1.15-2.1 2.85" />
          <path d="M12 16.5h.01" />
        </svg>
      );

    case "bolt":
      return (
        <svg
          {...common}
          fill="currentColor"
          stroke="none"
        >
          <path d="M13.2 2L4 13h6l-.8 9L19 10h-6l.2-8z" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

/* ============================================================
   NAVIGATION
   ============================================================ */

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: "dashboard",
    end: true,
  },
  {
    label: "Lead Management",
    path: "/admin/leads",
    icon: "leads",
  },
  {
    label: "Quote Management",
    path: "/admin/quotes",
    icon: "quotes",
  },
  {
    label: "Service & AMC",
    path: "/admin/service-amc",
    icon: "service",
  },
  {
    label: "Service Requests",
    path: "/admin/service-requests",
    icon: "support",
  },
  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: "inventory",
  },
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: "analytics",
  },
];

function getInitials(name) {
  const value = String(name || "Administrator").trim();

  if (!value) {
    return "AD";
  }

  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/* ============================================================
   ADMIN PORTAL SHELL
   ============================================================ */

export default function AdminPortalShell({
  children,
  title = "Admin Portal",
  subtitle = "SKYTECH Digital Power Platform",
}) {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [adminName, setAdminName] =
    useState("Administrator");

  /* ----------------------------------------------------------
     LOAD ADMIN NAME
     ---------------------------------------------------------- */

  useEffect(() => {
    try {
      const possibleKeys = [
        "user",
        "currentUser",
        "auth_user",
        "skytech_user",
      ];

      for (const key of possibleKeys) {
        const raw =
          localStorage.getItem(key);

        if (!raw) {
          continue;
        }

        try {
          const parsed =
            JSON.parse(raw);

          const name =
            parsed?.name ||
            parsed?.full_name ||
            parsed?.username ||
            parsed?.email;

          if (name) {
            setAdminName(String(name));
            break;
          }
        } catch {
          if (raw.trim()) {
            setAdminName(raw.trim());
            break;
          }
        }
      }
    } catch {
      // Ignore localStorage errors.
    }
  }, []);

  /* ----------------------------------------------------------
     MOBILE ESCAPE
     ---------------------------------------------------------- */

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  /* ----------------------------------------------------------
     LOGOUT
     ---------------------------------------------------------- */

  const handleLogout = () => {
    clearAuth();

    try {
      localStorage.removeItem("user");
      localStorage.removeItem(
        "currentUser"
      );
      localStorage.removeItem(
        "auth_user"
      );
      localStorage.removeItem(
        "skytech_user"
      );

      sessionStorage.clear();
    } catch {
      // Ignore storage errors.
    }

    navigate("/portal/login", {
      replace: true,
    });
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  /* ----------------------------------------------------------
     NAVIGATION
     ---------------------------------------------------------- */

  const renderNavigation = () => (
    <nav className="space-y-1.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          onClick={closeMobile}
          className={({ isActive }) =>
            [
              "group relative flex min-h-[48px] items-center gap-3 rounded-lg px-4",
              "text-[14px] font-medium tracking-[0.01em]",
              "transition-all duration-200",
              isActive
                ? "bg-[#0866ff] text-white shadow-[0_4px_12px_rgba(8,102,255,0.25)]"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-white" />
              )}

              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-slate-400 group-hover:text-white",
                ].join(" ")}
              >
                <Icon
                  name={item.icon}
                  size={19}
                  strokeWidth={1.9}
                />
              </span>

              <span className="truncate">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      {/* ======================================================
          DESKTOP SIDEBAR
          ====================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col bg-[#0b1b33] lg:flex">
        {/* Brand */}

        <div className="flex h-[78px] items-center border-b border-white/10 px-5">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0866ff] text-white shadow-lg shadow-blue-900/30">
              <Icon
                name="bolt"
                size={24}
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[18px] font-bold tracking-tight text-white">
                SKYTECH
              </p>

              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
                Admin Portal
              </p>
            </div>
          </button>
        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          {renderNavigation()}

          <div className="my-6 border-t border-white/10" />

          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            System
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/support/amc-request")
            }
            className="group flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 text-left text-[14px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 group-hover:text-white">
              <Icon
                name="support"
                size={19}
              />
            </span>

            Support
          </button>
        </div>

        {/* Bottom user */}

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/[0.05] px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {getInitials(adminName)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {adminName}
              </p>

              <p className="truncate text-[11px] text-slate-400">
                Administrator
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Icon
              name="logout"
              size={19}
            />

            Logout
          </button>
        </div>
      </aside>

      {/* ======================================================
          MOBILE OVERLAY
          ====================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-[#071426]/70 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ======================================================
          MOBILE SIDEBAR
          ====================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col",
          "bg-[#0b1b33] shadow-2xl",
          "transition-transform duration-300 lg:hidden",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-[78px] items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            onClick={() => {
              closeMobile();
              navigate("/admin");
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0866ff] text-white">
              <Icon
                name="bolt"
                size={22}
              />
            </div>

            <div className="text-left">
              <p className="font-bold text-white">
                SKYTECH
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-400">
                Admin Portal
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <Icon
              name="close"
              size={21}
            />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          {renderNavigation()}

          <div className="my-6 border-t border-white/10" />

          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            System
          </p>

          <button
            type="button"
            onClick={() => {
              closeMobile();
              navigate("/support/amc-request");
            }}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <Icon
              name="support"
              size={19}
            />

            Support
          </button>
        </div>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <Icon
              name="logout"
              size={19}
            />

            Logout
          </button>
        </div>
      </aside>

      {/* ======================================================
          MAIN AREA
          ====================================================== */}

      <div className="min-h-screen lg:pl-[250px]">
        {/* ====================================================
            TOP HEADER
            ==================================================== */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex min-h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left */}

            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileOpen(true)
                }
                aria-label="Open navigation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                <Icon
                  name="menu"
                  size={21}
                />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  {title}
                </h1>

                <p className="hidden truncate text-xs text-slate-500 sm:block">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Right */}

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Notifications */}

              <button
                type="button"
                aria-label="Notifications"
                className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 sm:flex"
              >
                <Icon
                  name="bell"
                  size={20}
                />
              </button>

              {/* Settings */}

              <button
                type="button"
                aria-label="Settings"
                className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:flex"
              >
                <Icon
                  name="settings"
                  size={20}
                />
              </button>

              {/* Help */}

              <button
                type="button"
                aria-label="Help"
                className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:flex"
              >
                <Icon
                  name="help"
                  size={20}
                />
              </button>

              {/* Website */}

              <button
                type="button"
                onClick={() => navigate("/")}
                className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex"
              >
                <Icon
                  name="globe"
                  size={17}
                />

                Website
              </button>

              <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />

              {/* Admin avatar */}

              <button
                type="button"
                onClick={() => navigate("/admin")}
                aria-label="Admin profile"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 ring-2 ring-white"
              >
                {getInitials(adminName)}
              </button>
            </div>
          </div>
        </header>

        {/* ====================================================
            CONTENT
            ==================================================== */}

        <main className="min-h-[calc(100vh-72px)] bg-[#f4f7fb]">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}