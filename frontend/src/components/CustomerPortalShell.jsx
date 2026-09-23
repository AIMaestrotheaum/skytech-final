import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "../utils/auth";

/*
|--------------------------------------------------------------------------
| Customer Portal Shell
|--------------------------------------------------------------------------
|
| Shared customer portal layout.
|
| The original SKYTECH Stitch dashboard is preserved for:
| - Header
| - Sidebar
| - Customer profile
| - Logout
| - Mobile menu
|
| React pages can provide children for:
| - Service Request
| - AMC Request
| - Customer Support
|
|--------------------------------------------------------------------------
*/

const DEFAULT_IFRAME_SRC =
  "/stitch/customer_dashboard_skytech_electricals/code.html";

/*
|--------------------------------------------------------------------------
| Resolve sidebar route
|--------------------------------------------------------------------------
*/

function resolveRoute(element) {
  if (!element) {
    return null;
  }

  const clickable =
    element.closest?.(
      "button, a, [role='button'], [data-route]"
    );

  if (!clickable) {
    return null;
  }

  const text = String(
    clickable.textContent || ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  if (
    text === "dashboard" ||
    text === "home" ||
    text.includes("dashboard")
  ) {
    return "/portal/dashboard";
  }

  /*
  |--------------------------------------------------------------------------
  | Equipment
  |--------------------------------------------------------------------------
  */

  if (
    text === "equipment" ||
    text.includes("my equipment") ||
    text.includes("view equipment")
  ) {
    return "/portal/equipment";
  }

  /*
  |--------------------------------------------------------------------------
  | Service History
  |--------------------------------------------------------------------------
  */

  if (
    text === "service history" ||
    text.includes("service history") ||
    text.includes("service schedule")
  ) {
    return "/portal/service-history";
  }

  /*
  |--------------------------------------------------------------------------
  | Request Service
  |--------------------------------------------------------------------------
  */

  if (
    text === "request service" ||
    text.includes("request service")
  ) {
    return "/portal/service-request";
  }

  /*
  |--------------------------------------------------------------------------
  | Service Request
  |--------------------------------------------------------------------------
  */

  if (
    text === "service request" ||
    text.includes("service request")
  ) {
    return "/portal/service-request";
  }

  /*
  |--------------------------------------------------------------------------
  | AMC Request
  |--------------------------------------------------------------------------
  */

  if (
    text === "amc request" ||
    text.includes("amc request")
  ) {
    return "/portal/amc-request";
  }

  /*
  |--------------------------------------------------------------------------
  | AMC Enquiry
  |--------------------------------------------------------------------------
  */

  if (
    text === "amc enquiry" ||
    text.includes("amc enquiry")
  ) {
    return "/portal/amc-request";
  }

  /*
  |--------------------------------------------------------------------------
  | Support
  |--------------------------------------------------------------------------
  */

  if (
    text === "support" ||
    text.includes("customer support") ||
    text.includes("support")
  ) {
    return "/portal/support";
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  if (
    text === "logout" ||
    text === "sign out"
  ) {
    return "/portal/login";
  }

  /*
  |--------------------------------------------------------------------------
  | Fallback to Stitch data-route
  |--------------------------------------------------------------------------
  */

  const routeElement =
    clickable.closest?.("[data-route]");

  if (routeElement) {
    const route =
      routeElement.getAttribute("data-route");

    if (route) {
      if (
        route === "/support/amc-request"
      ) {
        return "/portal/support";
      }

      if (
        route === "/portal/amc-enquiry"
      ) {
        return "/portal/amc-request";
      }

      return route;
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Close sidebar
|--------------------------------------------------------------------------
*/

function closeSidebar(doc) {
  if (!doc) {
    return;
  }

  const sidebar =
    doc.querySelector(".sidebar");

  const main =
    doc.querySelector(".main");

  const overlay =
    doc.querySelector(
      ".sidebar-overlay, .overlay"
    );

  sidebar?.classList.remove(
    "open",
    "active",
    "show"
  );

  main?.classList.remove(
    "sidebar-open",
    "menu-open"
  );

  overlay?.classList.remove(
    "active",
    "show",
    "visible"
  );

  if (sidebar) {
    sidebar.style.removeProperty(
      "transform"
    );

    sidebar.style.removeProperty(
      "visibility"
    );

    sidebar.style.removeProperty(
      "opacity"
    );
  }

  if (overlay) {
    overlay.style.removeProperty(
      "display"
    );

    overlay.style.removeProperty(
      "opacity"
    );
  }

  doc.body.classList.remove(
    "sidebar-open",
    "menu-open",
    "no-scroll"
  );
}

/*
|--------------------------------------------------------------------------
| Open sidebar
|--------------------------------------------------------------------------
*/

function openSidebar(doc) {
  if (!doc) {
    return;
  }

  const sidebar =
    doc.querySelector(".sidebar");

  const overlay =
    doc.querySelector(
      ".sidebar-overlay, .overlay"
    );

  const main =
    doc.querySelector(".main");

  sidebar?.classList.add("open");

  overlay?.classList.add("active");

  main?.classList.add(
    "sidebar-open"
  );

  doc.body.classList.add(
    "sidebar-open"
  );
}

/*
|--------------------------------------------------------------------------
| Customer Portal Shell
|--------------------------------------------------------------------------
*/

export default function CustomerPortalShell({
  activeRoute = "/portal/dashboard",
  iframeSrc = DEFAULT_IFRAME_SRC,
  title = "SKYTECH Customer Portal",
  onReady,
  children,
}) {
  const iframeRef =
    useRef(null);

  const navigate =
    useNavigate();

  /*
   * Width of Stitch sidebar.
   */
  const [sidebarWidth, setSidebarWidth] =
    useState(318);

  /*
   * Whether current page has custom React content.
   */
  const hasChildren =
    children !== undefined &&
    children !== null;

  /*
  |--------------------------------------------------------------------------
  | Attach Stitch navigation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const iframe =
      iframeRef.current;

    if (!iframe) {
      return undefined;
    }

    let cleanup = null;
    let loadTimer = null;

    const updateSidebarWidth = (doc) => {
      const sidebar =
        doc.querySelector(".sidebar");

      if (!sidebar) {
        return;
      }

      const rect =
        sidebar.getBoundingClientRect();

      if (
        rect.width &&
        rect.width > 100
      ) {
        setSidebarWidth(
          Math.round(rect.width)
        );
      }
    };

    const attach = () => {
      const doc =
        iframe.contentDocument ||
        iframe.contentWindow?.document;

      if (!doc) {
        return;
      }

      /*
       * Remove previous handlers.
       */
      if (cleanup) {
        cleanup();
        cleanup = null;
      }

      /*
       * Measure sidebar.
       */
      updateSidebarWidth(doc);

      /*
       * Hide Stitch main content when a React
       * child page is being displayed.
       *
       * We keep the original sidebar/header.
       */
      let styleElement = null;

      if (hasChildren) {
        styleElement =
          doc.createElement("style");

        styleElement.setAttribute(
          "data-skytech-react-page",
          "true"
        );

        styleElement.textContent = `
          .skytech-react-page-active .main {
            visibility: hidden !important;
          }

          .skytech-react-page-active .content {
            visibility: hidden !important;
          }
        `;

        doc.head.appendChild(
          styleElement
        );

        doc.body.classList.add(
          "skytech-react-page-active"
        );
      }

      /*
       * Mark active sidebar route.
       */
      doc
        .querySelectorAll(
          "[data-route]"
        )
        .forEach((element) => {
          element.classList.remove(
            "active"
          );

          const route =
            element.getAttribute(
              "data-route"
            );

          const text =
            String(
              element.textContent || ""
            )
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();

          let resolvedRoute =
            route;

          if (
            route ===
            "/support/amc-request"
          ) {
            resolvedRoute =
              "/portal/support";
          }

          if (
            route ===
            "/portal/amc-enquiry"
          ) {
            resolvedRoute =
              "/portal/amc-request";
          }

          if (
            text.includes(
              "request service"
            ) ||
            text.includes(
              "service request"
            )
          ) {
            resolvedRoute =
              "/portal/service-request";
          }

          if (
            text.includes(
              "amc request"
            ) ||
            text.includes(
              "amc enquiry"
            )
          ) {
            resolvedRoute =
              "/portal/amc-request";
          }

          if (
            text === "support" ||
            text.includes(
              "customer support"
            )
          ) {
            resolvedRoute =
              "/portal/support";
          }

          if (
            resolvedRoute ===
            activeRoute
          ) {
            element.classList.add(
              "active"
            );
          }
        });

      /*
      |--------------------------------------------------------------------------
      | Navigation click
      |--------------------------------------------------------------------------
      */

      const handleClick = (event) => {
        const target =
          event.target;

        if (!target) {
          return;
        }

        const clickable =
          target.closest?.(
            "button, a, [role='button'], [data-route]"
          );

        if (!clickable) {
          return;
        }

        /*
         * Do not interfere with forms.
         */
        if (
          clickable.closest?.("form") ||
          clickable.matches?.(
            "input, textarea, select"
          )
        ) {
          return;
        }

        const route =
          resolveRoute(clickable);

        if (!route) {
          return;
        }

        /*
         * Ignore external links.
         */
        if (
          route.startsWith("http://") ||
          route.startsWith("https://")
        ) {
          return;
        }

        /*
         * Stop original Stitch link.
         */
        event.preventDefault();
        event.stopPropagation();

        /*
         * Logout.
         */
        if (
          route === "/portal/login"
        ) {
          const text =
            String(
              clickable.textContent || ""
            )
              .trim()
              .toLowerCase();

          if (
            text === "logout" ||
            text === "sign out"
          ) {
            try {
              clearAuth();
            } catch (error) {
              console.warn(
                "SKYTECH logout cleanup failed:",
                error
              );
            }

            navigate(
              "/portal/login"
            );

            return;
          }
        }

        /*
         * Close sidebar before navigation.
         */
        closeSidebar(doc);

        /*
         * React Router navigation.
         */
        navigate(route);
      };

      /*
       * Capture phase.
       */
      doc.addEventListener(
        "click",
        handleClick,
        true
      );

      /*
      |--------------------------------------------------------------------------
      | Mobile menu
      |--------------------------------------------------------------------------
      */

      const handleMenuClick = (
        event
      ) => {
        const target =
          event.target;

        if (!target) {
          return;
        }

        const clickable =
          target.closest?.(
            ".menu-toggle, .hamburger, .mobile-menu-toggle, [data-menu-toggle]"
          );

        if (!clickable) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const sidebar =
          doc.querySelector(
            ".sidebar"
          );

        if (
          sidebar?.classList.contains(
            "open"
          )
        ) {
          closeSidebar(doc);
        } else {
          openSidebar(doc);
        }
      };

      doc.addEventListener(
        "click",
        handleMenuClick,
        true
      );

      /*
      |--------------------------------------------------------------------------
      | Overlay
      |--------------------------------------------------------------------------
      */

      const handleOverlayClick = (
        event
      ) => {
        const target =
          event.target;

        if (!target) {
          return;
        }

        const overlay =
          target.closest?.(
            ".sidebar-overlay, .overlay"
          );

        if (!overlay) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        closeSidebar(doc);
      };

      doc.addEventListener(
        "click",
        handleOverlayClick,
        true
      );

      /*
      |--------------------------------------------------------------------------
      | ESC
      |--------------------------------------------------------------------------
      */

      const handleKeyDown = (
        event
      ) => {
        if (
          event.key === "Escape" ||
          event.key === "Esc"
        ) {
          closeSidebar(doc);
        }
      };

      doc.addEventListener(
        "keydown",
        handleKeyDown
      );

      /*
      |--------------------------------------------------------------------------
      | Page-specific callback
      |--------------------------------------------------------------------------
      */

      if (
        typeof onReady === "function"
      ) {
        try {
          onReady(
            doc,
            navigate
          );
        } catch (error) {
          console.error(
            "SKYTECH CustomerPortalShell onReady error:",
            error
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Cleanup
      |--------------------------------------------------------------------------
      */

      cleanup = () => {
        doc.removeEventListener(
          "click",
          handleClick,
          true
        );

        doc.removeEventListener(
          "click",
          handleMenuClick,
          true
        );

        doc.removeEventListener(
          "click",
          handleOverlayClick,
          true
        );

        doc.removeEventListener(
          "keydown",
          handleKeyDown
        );

        if (styleElement) {
          styleElement.remove();
        }

        doc.body.classList.remove(
          "skytech-react-page-active"
        );
      };
    };

    /*
    |--------------------------------------------------------------------------
    | Iframe load
    |--------------------------------------------------------------------------
    */

    const handleLoad = () => {
      if (loadTimer) {
        window.clearTimeout(
          loadTimer
        );
      }

      loadTimer =
        window.setTimeout(
          attach,
          100
        );
    };

    iframe.addEventListener(
      "load",
      handleLoad
    );

    /*
     * Already loaded.
     */
    if (
      iframe.contentDocument &&
      iframe.contentDocument.readyState ===
        "complete"
    ) {
      handleLoad();
    }

    /*
    |--------------------------------------------------------------------------
    | Cleanup effect
    |--------------------------------------------------------------------------
    */

    return () => {
      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (loadTimer) {
        window.clearTimeout(
          loadTimer
        );
      }

      if (cleanup) {
        cleanup();
      }
    };
  }, [
    activeRoute,
    iframeSrc,
    navigate,
    onReady,
    hasChildren,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "700px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* 
        Original Stitch dashboard.
        It provides the sidebar and portal chrome.
      */}
      <iframe
        ref={iframeRef}
        title={title}
        src={iframeSrc}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          border: "none",
          zIndex: 1,
          background: "#fff",
        }}
      />

      {/* 
        React page content.

        The Stitch sidebar remains visible on the left.
        The React page is displayed on the right.
      */}
      {hasChildren && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: `${sidebarWidth}px`,
            zIndex: 5,
            background: "#fff",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}