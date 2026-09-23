import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    {
      label: "Home",
      path: "/",
    },
    {
      label: "About",
      path: "/about",
    },
    {
      label: "Products",
      path: "/products",
    },
    {
      label: "Services",
      path: "/services",
    },
    {
      label: "Industries",
      path: "/industries",
    },
    {
      label: "Projects",
      path: "/projects",
    },
    {
      label: "Knowledge",
      path: "/knowledge",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* =========================
          HEADER
      ========================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-16 flex items-center justify-between">

            {/* Logo */}
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3"
            >

              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <span className="material-symbols-outlined">
                  bolt
                </span>
              </div>

              <div>
                <div className="font-bold tracking-wide text-slate-900">
                  SKYTECH
                </div>

                <div className="hidden sm:block text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  Digital Power Platform
                </div>
              </div>

            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">

              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `
                      px-3
                      py-2
                      rounded-lg
                      text-sm
                      transition-colors
                      ${
                        isActive
                          ? "text-slate-900 bg-slate-100 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }
                    `
                  }
                >
                  {item.label}
                </NavLink>
              ))}

            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">

              <NavLink
                to="/contact"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Contact
              </NavLink>

              <NavLink
                to="/quote"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Get a Quote
              </NavLink>

            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <span className="material-symbols-outlined">
                {menuOpen ? "close" : "menu"}
              </span>
            </button>

          </div>

        </div>

        {/* =========================
            MOBILE NAVIGATION
        ========================== */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">

            <nav className="px-4 py-4 space-y-1">

              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={({ isActive }) =>
                    `
                      block
                      px-4
                      py-3
                      rounded-lg
                      text-sm
                      ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }
                    `
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">

                <NavLink
                  to="/contact"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="block px-4 py-3 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                >
                  Contact
                </NavLink>

                <NavLink
                  to="/quote"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="block px-4 py-3 rounded-lg text-sm font-semibold bg-slate-900 text-white text-center"
                >
                  Get a Quote
                </NavLink>

              </div>

            </nav>

          </div>
        )}

      </header>

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="bg-slate-950 text-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Brand */}
            <div className="md:col-span-2">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-9 h-9 rounded-lg bg-white text-slate-950 flex items-center justify-center">
                  <span className="material-symbols-outlined">
                    bolt
                  </span>
                </div>

                <div className="font-bold tracking-wide">
                  SKYTECH
                </div>

              </div>

              <p className="text-sm text-slate-400 max-w-md leading-6">
                Digital power solutions for reliable,
                efficient and intelligent electrical
                infrastructure.
              </p>

            </div>

            {/* Quick Links */}
            <div>

              <h3 className="text-sm font-semibold mb-4">
                Quick Links
              </h3>

              <div className="space-y-2">

                {navItems.slice(0, 5).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="block text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </NavLink>
                ))}

              </div>

            </div>

            {/* Support */}
            <div>

              <h3 className="text-sm font-semibold mb-4">
                Support
              </h3>

              <div className="space-y-2">

                <NavLink
                  to="/support/amc-request"
                  className="block text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Service & AMC Request
                </NavLink>

                <NavLink
                  to="/portal/login"
                  className="block text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Customer Portal
                </NavLink>

                <NavLink
                  to="/contact"
                  className="block text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Contact Support
                </NavLink>

              </div>

            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3">

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} SKYTECH ELECTRICALS. All rights reserved.
            </p>

            <p className="text-xs text-slate-500">
              Digital Power Platform
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}