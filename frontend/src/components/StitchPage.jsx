import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NEXT_PAGE = {
  "/": "/about",
  "/about": "/products",
  "/products": "/services",
  "/services": "/industries",
  "/industries": "/projects",
  "/projects": "/knowledge",
  "/knowledge": "/contact",
  "/contact": "/quote",
  "/quote": "/portal/login",
};

const PREVIOUS_PAGE = {
  "/about": "/",
  "/products": "/about",
  "/services": "/products",
  "/industries": "/services",
  "/projects": "/industries",
  "/knowledge": "/projects",
  "/contact": "/knowledge",
  "/quote": "/contact",
  "/portal/login": "/quote",
};

export default function StitchPage({ folder }) {
  const iframeRef = useRef(null);
  const navigatingRef = useRef(false);
  const userInteractedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [transition, setTransition] = useState("page-enter");

  /*
   * =========================================================
   * PAGE ENTER ANIMATION
   * =========================================================
   */

  useEffect(() => {
    navigatingRef.current = false;
    userInteractedRef.current = false;

    setTransition("page-enter");

    const timer = setTimeout(() => {
      setTransition("page-visible");
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  /*
   * =========================================================
   * NAVIGATION FUNCTION
   * =========================================================
   */

  const goToPage = (targetPage) => {
    if (!targetPage) {
      return;
    }

    if (navigatingRef.current) {
      return;
    }

    if (targetPage === location.pathname) {
      return;
    }

    navigatingRef.current = true;

    /*
     * Smooth exit animation.
     */
    setTransition("page-exit");

    /*
     * Normal React Router navigation.
     * This creates a browser history entry.
     */
    setTimeout(() => {
      navigate(targetPage);
    }, 450);
  };

  /*
   * =========================================================
   * STITCH POSTMESSAGE SCROLL BRIDGE
   * =========================================================
   *
   * Product page and other updated Stitch pages can send:
   *
   * {
   *   source: "skytech-stitch",
   *   type: "scroll-edge",
   *   edge: "top" / "bottom"
   * }
   *
   */

  useEffect(() => {
    const handleMessage = (event) => {
      /*
       * Only accept messages from this application.
       */
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data;

      if (!data) {
        return;
      }

      if (data.source !== "skytech-stitch") {
        return;
      }

      if (data.type !== "scroll-edge") {
        return;
      }

      /*
       * Ignore automatic "top" events immediately after
       * a page loads.
       *
       * Otherwise opening /products could immediately
       * navigate back to /about.
       */
      if (!userInteractedRef.current) {
        return;
      }

      if (data.edge === "bottom") {
        const nextPage = NEXT_PAGE[location.pathname];

        if (nextPage) {
          goToPage(nextPage);
        }

        return;
      }

      if (data.edge === "top") {
        const previousPage = PREVIOUS_PAGE[location.pathname];

        if (previousPage) {
          goToPage(previousPage);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [location.pathname]);

  /*
   * =========================================================
   * DIRECT IFRAME SCROLL DETECTION
   * =========================================================
   *
   * This keeps support for the existing Stitch pages that
   * do not yet send scroll-edge messages.
   */

  useEffect(() => {
    navigatingRef.current = false;

    const iframe = iframeRef.current;

    if (!iframe) {
      return;
    }

    let cleanupScroll = null;
    let cleanupWheel = null;

    const handleLoad = () => {
      try {
        const iframeDocument = iframe.contentDocument;
        const iframeWindow = iframe.contentWindow;

        if (!iframeDocument || !iframeWindow) {
          return;
        }

        /*
         * -----------------------------------------------------
         * SCROLL
         * -----------------------------------------------------
         */

        const handleScroll = () => {
          const scrollTop =
            iframeWindow.scrollY ||
            iframeDocument.documentElement.scrollTop ||
            iframeDocument.body.scrollTop ||
            0;

          const viewportHeight =
            iframeWindow.innerHeight ||
            iframeDocument.documentElement.clientHeight ||
            0;

          const documentHeight = Math.max(
            iframeDocument.documentElement.scrollHeight,
            iframeDocument.body?.scrollHeight || 0
          );

          /*
           * User has actually moved inside the page.
           */
          if (
            scrollTop > 5 &&
            scrollTop + viewportHeight <
              documentHeight - 30
          ) {
            userInteractedRef.current = true;
          }

          if (navigatingRef.current) {
            return;
          }

          /*
           * Bottom detection.
           */
          const reachedBottom =
            scrollTop + viewportHeight >=
            documentHeight - 30;

          if (reachedBottom) {
            userInteractedRef.current = true;

            const nextPage =
              NEXT_PAGE[location.pathname];

            if (!nextPage) {
              return;
            }

            goToPage(nextPage);
            return;
          }

          /*
           * Top detection.
           *
           * Only navigate backwards after the user has
           * interacted with the page.
           */
          const reachedTop = scrollTop <= 5;

          if (
            reachedTop &&
            userInteractedRef.current
          ) {
            const previousPage =
              PREVIOUS_PAGE[location.pathname];

            if (!previousPage) {
              return;
            }

            /*
             * We don't immediately navigate here because
             * simply loading a page starts at the top.
             *
             * The wheel handler below handles intentional
             * upward scrolling.
             */
          }
        };

        /*
         * -----------------------------------------------------
         * WHEEL
         * -----------------------------------------------------
         *
         * Handles the special case:
         *
         * User is already at the top and scrolls upward.
         */

        const handleWheel = (event) => {
          if (navigatingRef.current) {
            return;
          }

          const scrollTop =
            iframeWindow.scrollY ||
            iframeDocument.documentElement.scrollTop ||
            iframeDocument.body.scrollTop ||
            0;

          const viewportHeight =
            iframeWindow.innerHeight ||
            iframeDocument.documentElement.clientHeight ||
            0;

          const documentHeight = Math.max(
            iframeDocument.documentElement.scrollHeight,
            iframeDocument.body?.scrollHeight || 0
          );

          /*
           * User has deliberately interacted.
           */
          if (event.deltaY !== 0) {
            userInteractedRef.current = true;
          }

          /*
           * Scroll DOWN at bottom
           * → next page.
           */
          const atBottom =
            scrollTop + viewportHeight >=
            documentHeight - 30;

          if (
            atBottom &&
            event.deltaY > 0
          ) {
            const nextPage =
              NEXT_PAGE[location.pathname];

            if (nextPage) {
              goToPage(nextPage);
            }

            return;
          }

          /*
           * Scroll UP at top
           * → previous page.
           */
          const atTop = scrollTop <= 5;

          if (
            atTop &&
            event.deltaY < 0
          ) {
            const previousPage =
              PREVIOUS_PAGE[location.pathname];

            if (previousPage) {
              goToPage(previousPage);
            }
          }
        };

        iframeDocument.addEventListener(
          "scroll",
          handleScroll,
          {
            passive: true,
          }
        );

        iframeDocument.addEventListener(
          "wheel",
          handleWheel,
          {
            passive: true,
          }
        );

        cleanupScroll = () => {
          iframeDocument.removeEventListener(
            "scroll",
            handleScroll
          );
        };

        cleanupWheel = () => {
          iframeDocument.removeEventListener(
            "wheel",
            handleWheel
          );
        };
      } catch (error) {
        console.error(
          "SKYTECH page transition error:",
          error
        );
      }
    };

    iframe.addEventListener(
      "load",
      handleLoad
    );

    return () => {
      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (cleanupScroll) {
        cleanupScroll();
      }

      if (cleanupWheel) {
        cleanupWheel();
      }
    };
  }, [location.pathname, navigate]);

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <>
      <style>
        {`
          .skytech-page-transition {
            width: 100%;
            min-height: 100vh;
            background: #fff;

            transition:
              opacity 450ms ease,
              transform 450ms cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );

            will-change:
              opacity,
              transform;
          }

          .skytech-page-transition.page-enter {
            opacity: 0;
            transform: translateY(18px);
          }

          .skytech-page-transition.page-visible {
            opacity: 1;
            transform: translateY(0);
          }

          .skytech-page-transition.page-exit {
            opacity: 0;
            transform: translateY(-18px);
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .skytech-page-transition {
              transition:
                opacity 150ms ease;
            }

            .skytech-page-transition.page-enter,
            .skytech-page-transition.page-visible,
            .skytech-page-transition.page-exit {
              transform: none;
            }
          }
        `}
      </style>

      <div
        className={`skytech-page-transition ${transition}`}
      >
        <iframe
          ref={iframeRef}
          src={`/stitch/${folder}/code.html`}
          title={folder}
          style={{
            display: "block",
            width: "100%",
            height: "100vh",
            minHeight: "700px",
            border: "none",
          }}
        />
      </div>
    </>
  );
}