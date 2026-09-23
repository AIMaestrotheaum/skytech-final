import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { clearAuth } from "../utils/auth";

/*
|--------------------------------------------------------------------------
| GLOBAL STITCH ROUTES
|--------------------------------------------------------------------------
*/

const ROUTES = {
  // -----------------------------------------------------------------------
  // Public pages
  // -----------------------------------------------------------------------
  home: "/",
  about: "/about",
  products: "/products",
  services: "/services",
  industries: "/industries",
  projects: "/projects",
  "project gallery": "/projects",
  blog: "/knowledge",
  "knowledge center": "/knowledge",

  "get a quote": "/quote",
  "request a quote": "/quote",

  "talk to an expert": "/contact",
  "contact us": "/contact",
  contact: "/contact",
  "contact engineering": "/contact",
  "schedule a consultation": "/contact",
  "request technical consultation": "/contact",
  "technical consultation": "/contact",

  "view case study": "/projects",
  "our projects": "/projects",
  "view all projects": "/projects",
  "view details": "/projects",
  "view detailed solution": "/projects",
  "request emergency": "/contact",

  // -----------------------------------------------------------------------
  // Calculators
  // -----------------------------------------------------------------------
  "ups calculator": "/calculators/ups",
  "battery calculator": "/calculators/battery",
  "three phase ups": "/calculators/three-phase-ups",
  "ai power assistant":
    "/calculators/ai-power-assistant",

  // -----------------------------------------------------------------------
  // Portal
  // -----------------------------------------------------------------------
  "portal login": "/portal/login",
  login: "/portal/login",
  "customer login": "/portal/login",
  "admin login": "/portal/login",

  // -----------------------------------------------------------------------
  // Customer
  // -----------------------------------------------------------------------
  dashboard: "/portal/dashboard",

  equipment: "/portal/equipment",
  "my equipment": "/portal/equipment",
  "view equipment": "/portal/equipment",

  "service history":
    "/portal/service-history",
  "view service history":
    "/portal/service-history",

  "request service":
    "/support/amc-request",
  "service request":
    "/support/amc-request",
  "amc request":
    "/support/amc-request",
  support: "/support/amc-request",

  "amc status": "/portal/dashboard",

  // -----------------------------------------------------------------------
  // Admin
  // -----------------------------------------------------------------------
  "active amc": "/admin/service-amc",
  "open quotes": "/admin/quotes",
  "service requests":
    "/admin/service-requests",
  "lead management": "/admin/leads",
  leads: "/admin/leads",

  "new service request":
    "/admin/service-requests",

  "review renewal":
    "/admin/service-amc",

  "dispatch team":
    "/admin/service-requests",

  "recent enquiries":
    "/admin/leads",

  "view all": "/admin/leads",

  // -----------------------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------------------
  logout: "/portal/login",
};

/*
|--------------------------------------------------------------------------
| Normalize text
|--------------------------------------------------------------------------
*/

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| Resolve Stitch label to React route
|--------------------------------------------------------------------------
*/

function resolveRoute(label) {
  const normalized = normalize(label);

  if (!normalized) {
    return null;
  }

  /*
   * Exact match.
   */
  if (ROUTES[normalized]) {
    return ROUTES[normalized];
  }

  /*
   * Customer equipment variations.
   */
  if (
    normalized.includes("my equipment")
  ) {
    return "/portal/equipment";
  }

  if (
    normalized.includes("view equipment")
  ) {
    return "/portal/equipment";
  }

  if (
    normalized === "equipment"
  ) {
    return "/portal/equipment";
  }

  /*
   * Service history variations.
   */
  if (
    normalized.includes(
      "service history"
    )
  ) {
    return "/portal/service-history";
  }

  /*
   * Customer service request variations.
   */
  if (
    normalized.includes(
      "request service"
    )
  ) {
    return "/support/amc-request";
  }

  if (
    normalized.includes(
      "service request"
    ) &&
    !normalized.includes("admin")
  ) {
    return "/support/amc-request";
  }

  if (
    normalized.includes("amc request")
  ) {
    return "/support/amc-request";
  }

  if (
    normalized === "support" ||
    normalized.includes(
      "customer support"
    )
  ) {
    return "/support/amc-request";
  }

  /*
   * Dashboard variations.
   */
  if (
    normalized === "dashboard" ||
    normalized ===
      "customer dashboard"
  ) {
    return "/portal/dashboard";
  }

  /*
   * Logout variations.
   */
  if (
    normalized === "logout" ||
    normalized === "sign out"
  ) {
    return "/portal/login";
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Products / Projects header
|--------------------------------------------------------------------------
*/

function ProductsProjectsHeader() {
  const location = useLocation();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const currentPath =
    location.pathname;

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
      label: "Blog",
      path: "/knowledge",
    },
  ];

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className="
          fixed
          top-0
          left-0
          right-0
          z-[9999]
          bg-white
          border-b
          border-gray-200
          shadow-sm
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            h-16
            flex
            items-center
            justify-between
          "
        >
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="
              text-xl
              sm:text-2xl
              font-extrabold
              tracking-tight
              text-black
              whitespace-nowrap
            "
          >
            SKYTECH ELECTRICALS
          </Link>

          {/* Desktop navigation */}
          <nav
            className="
              hidden
              lg:flex
              items-center
              gap-6
            "
          >
            {navItems.map((item) => {
              const active =
                currentPath ===
                item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative
                    py-5
                    text-sm
                    font-medium
                    transition-colors
                    ${
                      active
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }
                  `}
                >
                  {item.label}

                  {active && (
                    <span
                      className="
                        absolute
                        left-0
                        right-0
                        bottom-0
                        h-0.5
                        bg-blue-600
                      "
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div
            className="
              hidden
              lg:flex
              items-center
              gap-3
            "
          >
            <Link
              to="/quote"
              className="
                px-4
                py-2
                rounded
                bg-blue-600
                text-white
                text-sm
                font-semibold
                hover:bg-blue-700
                transition
              "
            >
              Get a Quote
            </Link>

            <Link
              to="/contact"
              className="
                w-9
                h-9
                flex
                items-center
                justify-center
                rounded-full
                border
                border-gray-300
                text-gray-700
                hover:text-blue-600
                hover:border-blue-600
                transition
              "
              aria-label="Contact"
            >
              ?
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
            className="
              lg:hidden
              w-10
              h-10
              flex
              items-center
              justify-center
              rounded
              border
              border-gray-300
              text-gray-800
            "
            aria-label="Toggle menu"
          >
            <span className="text-xl">
              ☰
            </span>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="
              lg:hidden
              border-t
              border-gray-200
              bg-white
              shadow-lg
            "
          >
            <nav
              className="
                px-4
                py-3
                flex
                flex-col
              "
            >
              {navItems.map((item) => {
                const active =
                  currentPath ===
                  item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={
                      closeMobileMenu
                    }
                    className={`
                      px-3
                      py-3
                      rounded
                      text-sm
                      font-medium
                      ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                to="/quote"
                onClick={
                  closeMobileMenu
                }
                className="
                  mt-2
                  px-4
                  py-3
                  rounded
                  bg-blue-600
                  text-white
                  text-center
                  font-semibold
                "
              >
                Get a Quote
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Header spacer */}
      <div className="h-16" />
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Main Stitch Navigation Bridge
|--------------------------------------------------------------------------
*/

export default function StitchNavigationBridge() {
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    const handleMessage = (event) => {
      /*
       * Only accept messages from this application.
       */
      if (
        event.origin !==
        window.location.origin
      ) {
        return;
      }

      const message =
        event.data;

      if (!message) {
        return;
      }

      /*
       * Stitch pages must send:
       *
       * {
       *   source: "skytech-stitch",
       *   type: "navigate",
       *   label: "my equipment"
       * }
       */
      if (
        message.source !==
        "skytech-stitch"
      ) {
        return;
      }

      if (
        message.type !==
        "navigate"
      ) {
        return;
      }

      const label =
        normalize(
          message.label
        );

      if (!label) {
        return;
      }

      const route =
        resolveRoute(label);

      if (!route) {
        console.warn(
          "SKYTECH: No route found for Stitch navigation:",
          label
        );

        return;
      }

      /*
       * Logout.
       */
      if (
        route === "/portal/login" &&
        (
          label === "logout" ||
          label === "sign out"
        )
      ) {
        clearAuth();
      }

      console.log(
        "SKYTECH Stitch Navigation:",
        label,
        "→",
        route
      );

      navigate(route);
    };

    window.addEventListener(
      "message",
      handleMessage
    );

    return () => {
      window.removeEventListener(
        "message",
        handleMessage
      );
    };
  }, [navigate]);

  /*
   * Products and Projects use the
   * React header.
   */
  const showPublicHeader =
    location.pathname ===
      "/products" ||
    location.pathname ===
      "/projects";

  return showPublicHeader ? (
    <ProductsProjectsHeader />
  ) : null;
}