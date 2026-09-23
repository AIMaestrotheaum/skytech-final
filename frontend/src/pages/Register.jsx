import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../utils/api";
import { clearAuth } from "../utils/auth";

export default function Register() {
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return undefined;
    }

    let timeoutId = null;
    let cleanupRegister = null;
    let isMounted = true;

    const setupRegister = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        if (!isMounted) {
          return;
        }

        const doc =
          iframe.contentDocument ||
          iframe.contentWindow?.document;

        if (!doc) {
          return;
        }

        const form = doc.querySelector("form");

        if (!form) {
          console.warn(
            "Registration form not found in Stitch page."
          );
          return;
        }

        if (cleanupRegister) {
          cleanupRegister();
          cleanupRegister = null;
        }

        const getInput = (...selectors) => {
          for (const selector of selectors) {
            const element =
              doc.querySelector(selector);

            if (element) {
              return element;
            }
          }

          return null;
        };

        const nameInput = getInput(
          "#name",
          "#full-name",
          "#full_name",
          'input[name="name"]',
          'input[name="full_name"]'
        );

        const emailInput = getInput(
          "#email",
          'input[name="email"]',
          'input[type="email"]'
        );

        const passwordInput = getInput(
          "#password",
          'input[name="password"]',
          'input[type="password"]'
        );

        const confirmPasswordInput = getInput(
          "#confirm-password",
          "#confirm_password",
          "#password-confirm",
          'input[name="confirm_password"]',
          'input[name="confirmPassword"]'
        );

        if (
          !nameInput ||
          !emailInput ||
          !passwordInput
        ) {
          console.warn(
            "Required registration fields were not found."
          );
          return;
        }

        /*
         * LOGIN LINKS
         */
        const loginLinks =
          doc.querySelectorAll(
            'a[href*="login"], a[href="/portal/login"]'
          );

        const loginHandlers = [];

        loginLinks.forEach((link) => {
          const handler = (event) => {
            event.preventDefault();

            navigate("/portal/login");
          };

          link.addEventListener(
            "click",
            handler
          );

          loginHandlers.push({
            link,
            handler,
          });
        });

        /*
         * PASSWORD VISIBILITY
         */
        const passwordVisibilityButton =
          passwordInput.parentElement?.querySelector(
            'button[type="button"]'
          );

        const confirmVisibilityButton =
          confirmPasswordInput?.parentElement?.querySelector(
            'button[type="button"]'
          );

        let passwordVisibilityHandler = null;
        let confirmVisibilityHandler = null;

        if (passwordVisibilityButton) {
          passwordVisibilityHandler = () => {
            const isPassword =
              passwordInput.type ===
              "password";

            passwordInput.type = isPassword
              ? "text"
              : "password";

            const icon =
              passwordVisibilityButton.querySelector(
                ".material-symbols-outlined"
              );

            if (icon) {
              icon.textContent = isPassword
                ? "visibility"
                : "visibility_off";
            }
          };

          passwordVisibilityButton.addEventListener(
            "click",
            passwordVisibilityHandler
          );
        }

        if (confirmVisibilityButton) {
          confirmVisibilityHandler = () => {
            const isPassword =
              confirmPasswordInput.type ===
              "password";

            confirmPasswordInput.type =
              isPassword
                ? "text"
                : "password";

            const icon =
              confirmVisibilityButton.querySelector(
                ".material-symbols-outlined"
              );

            if (icon) {
              icon.textContent = isPassword
                ? "visibility"
                : "visibility_off";
            }
          };

          confirmVisibilityButton.addEventListener(
            "click",
            confirmVisibilityHandler
          );
        }

        /*
         * REGISTRATION
         */
        const submitHandler = async (event) => {
          event.preventDefault();

          const name =
            nameInput.value.trim();

          const email =
            emailInput.value.trim().toLowerCase();

          const password =
            passwordInput.value;

          const confirmPassword =
            confirmPasswordInput?.value || "";

          /*
           * VALIDATION
           */
          if (!name) {
            alert(
              "Please enter your name."
            );

            nameInput.focus();
            return;
          }

          if (name.length < 2) {
            alert(
              "Name must contain at least 2 characters."
            );

            nameInput.focus();
            return;
          }

          if (!email) {
            alert(
              "Please enter your email."
            );

            emailInput.focus();
            return;
          }

          const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailPattern.test(email)) {
            alert(
              "Please enter a valid email address."
            );

            emailInput.focus();
            return;
          }

          if (!password) {
            alert(
              "Please create a password."
            );

            passwordInput.focus();
            return;
          }

          if (password.length < 6) {
            alert(
              "Password must contain at least 6 characters."
            );

            passwordInput.focus();
            return;
          }

          if (
            confirmPasswordInput &&
            password !== confirmPassword
          ) {
            alert(
              "Passwords do not match."
            );

            confirmPasswordInput.focus();
            return;
          }

          /*
           * BUTTON
           */
          const submitButton =
            form.querySelector(
              'button[type="submit"], input[type="submit"]'
            );

          const originalButtonHTML =
            submitButton?.innerHTML;

          if (submitButton) {
            submitButton.disabled = true;

            if (
              submitButton.tagName ===
              "BUTTON"
            ) {
              submitButton.innerHTML = `
                <span class="material-symbols-outlined text-[20px]">
                  progress_activity
                </span>
                Creating Account...
              `;
            }
          }

          try {
            /*
             * Clear any old authentication.
             */
            clearAuth();

            /*
             * Backend payload.
             */
            const payload = {
              name,
              email,
              password,
            };

            /*
             * Register customer.
             */
            const response =
              await apiFetch(
                "/api/auth/register-customer",
                {
                  method: "POST",
                  body: payload,
                }
              );

            let data = {};

            try {
              data =
                await response.json();
            } catch {
              data = {};
            }

            if (!response.ok) {
              throw new Error(
                data.detail ||
                  data.message ||
                  "Registration failed."
              );
            }

            if (!isMounted) {
              return;
            }

            /*
             * Registration successful.
             */
            alert(
              "Customer account created successfully. Please login."
            );

            navigate(
              "/portal/login",
              {
                replace: true,
              }
            );
          } catch (error) {
            if (!isMounted) {
              return;
            }

            console.error(
              "Registration Error:",
              error
            );

            alert(
              error?.message ||
                "Unable to create your account. Please try again."
            );

            if (submitButton) {
              submitButton.disabled = false;

              if (
                submitButton.tagName ===
                "BUTTON"
              ) {
                submitButton.innerHTML =
                  originalButtonHTML ||
                  "Create Account";
              }
            }
          }
        };

        form.addEventListener(
          "submit",
          submitHandler
        );

        /*
         * Cleanup iframe listeners.
         */
        cleanupRegister = () => {
          form.removeEventListener(
            "submit",
            submitHandler
          );

          loginHandlers.forEach(
            ({ link, handler }) => {
              link.removeEventListener(
                "click",
                handler
              );
            }
          );

          if (
            passwordVisibilityButton &&
            passwordVisibilityHandler
          ) {
            passwordVisibilityButton.removeEventListener(
              "click",
              passwordVisibilityHandler
            );
          }

          if (
            confirmVisibilityButton &&
            confirmVisibilityHandler
          ) {
            confirmVisibilityButton.removeEventListener(
              "click",
              confirmVisibilityHandler
            );
          }
        };
      }, 300);
    };

    iframe.addEventListener(
      "load",
      setupRegister
    );

    /*
     * Handle an iframe that is already loaded.
     */
    if (
      iframe.contentDocument?.readyState ===
      "complete"
    ) {
      setupRegister();
    }

    return () => {
      isMounted = false;

      iframe.removeEventListener(
        "load",
        setupRegister
      );

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (cleanupRegister) {
        cleanupRegister();
      }
    };
  }, [navigate]);

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <iframe
        ref={iframeRef}
        title="SKYTECH Customer Registration"
        src="/stitch/portal_register_skytech_electricals/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}