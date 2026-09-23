import { useEffect } from "react";
import { logout } from "../utils/auth";

export default function StitchLogout({ iframeRef }) {
  useEffect(() => {
    const iframe = iframeRef?.current;

    if (!iframe) return undefined;

    let cleanup = () => {};

    const setupLogout = () => {
      const doc = iframe.contentDocument;

      if (!doc) return;

      cleanup();

      const elements = Array.from(
        doc.querySelectorAll("button, a, [role='button']")
      );

      const logoutElements = elements.filter((element) => {
        const text = element.textContent?.trim().toLowerCase() || "";
        const aria = element.getAttribute("aria-label")?.toLowerCase() || "";
        const title = element.getAttribute("title")?.toLowerCase() || "";

        const combined = `${text} ${aria} ${title}`;

        return (
          combined.includes("logout") ||
          combined.includes("log out") ||
          combined.includes("sign out") ||
          combined.includes("signout")
        );
      });

      const handlers = logoutElements.map((element) => {
        const handler = (event) => {
          event.preventDefault();
          event.stopPropagation();
          logout();
        };

        element.addEventListener("click", handler);
        return { element, handler };
      });

      cleanup = () => {
        handlers.forEach(({ element, handler }) => {
          element.removeEventListener("click", handler);
        });
      };
    };

    iframe.addEventListener("load", setupLogout);

    if (iframe.contentDocument?.readyState === "complete") {
      setupLogout();
    }

    return () => {
      iframe.removeEventListener("load", setupLogout);
      cleanup();
    };
  }, [iframeRef]);

  return null;
}