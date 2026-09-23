import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function ContactUs() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return undefined;

    let form = null;
    let submitHandler = null;
    let timeoutId = null;

    const findField = (doc, keywords, container = doc) => {
      const fields = Array.from(
        container.querySelectorAll("input, textarea, select")
      );

      return (
        fields.find((field) => {
          const name = field.getAttribute("name")?.toLowerCase() || "";
          const id = field.getAttribute("id")?.toLowerCase() || "";
          const placeholder =
            field.getAttribute("placeholder")?.toLowerCase() || "";
          const aria =
            field.getAttribute("aria-label")?.toLowerCase() || "";

          const combined = `${name} ${id} ${placeholder} ${aria}`;

          return keywords.some((keyword) =>
            combined.includes(keyword.toLowerCase())
          );
        }) || null
      );
    };

    const showMessage = (doc, message, success = true) => {
      let messageBox = doc.querySelector(".skytech-form-message");

      if (!messageBox) {
        messageBox = doc.createElement("div");
        messageBox.className = "skytech-form-message";

        Object.assign(messageBox.style, {
          marginTop: "16px",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "600",
          whiteSpace: "pre-line",
        });

        if (form) {
          form.appendChild(messageBox);
        }
      }

      messageBox.textContent = message;

      messageBox.style.background = success
        ? "#e8f5e9"
        : "#ffebee";

      messageBox.style.color = success
        ? "#1b5e20"
        : "#b71c1c";
    };

    const cleanupForm = () => {
      if (form && submitHandler) {
        form.removeEventListener("submit", submitHandler);
      }

      form = null;
      submitHandler = null;
    };

    const setupPage = () => {
      const doc = iframe.contentDocument;

      if (!doc) {
        console.error("Contact iframe document not available.");
        return;
      }

      cleanupForm();

      form = doc.querySelector("form");

      if (!form) {
        console.error("SKYTECH Contact form was not found.");
        return;
      }

      const nameInput =
        findField(
          doc,
          [
            "full name",
            "fullname",
            "customer_name",
            "customer name",
          ],
          form
        ) ||
        form.querySelector("input[type='text']");

      const companyInput = findField(
        doc,
        [
          "company name",
          "company",
          "organization",
        ],
        form
      );

      const emailInput = findField(
        doc,
        [
          "email address",
          "email",
        ],
        form
      );

      const phoneInput = findField(
        doc,
        [
          "phone number",
          "phone",
          "mobile",
          "contact number",
        ],
        form
      );

      const requirementSelect =
        findField(
          doc,
          [
            "requirement",
            "primary requirement",
          ],
          form
        ) || form.querySelector("select");

      const projectDetailsInput =
        findField(
          doc,
          [
            "project details",
            "project_detail",
            "message",
            "details",
          ],
          form
        ) || form.querySelector("textarea");

      submitHandler = async (event) => {
        event.preventDefault();

        const customerName =
          nameInput?.value?.trim() || "";

        const company =
          companyInput?.value?.trim() || "";

        const email =
          emailInput?.value?.trim() || "";

        const phone =
          phoneInput?.value?.trim() || "";

        const requirement =
          requirementSelect?.value?.trim() || "";

        const message =
          projectDetailsInput?.value?.trim() || "";

        if (!customerName) {
          showMessage(
            doc,
            "Please enter your full name.",
            false
          );
          return;
        }

        if (email) {
          const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailPattern.test(email)) {
            showMessage(
              doc,
              "Please enter a valid email address.",
              false
            );
            return;
          }
        }

        if (!requirement) {
          showMessage(
            doc,
            "Please select your primary requirement.",
            false
          );
          return;
        }

        const normalizedRequirement =
          requirement.toLowerCase();

        if (
          normalizedRequirement === "select" ||
          normalizedRequirement === "select requirement" ||
          normalizedRequirement === "choose"
        ) {
          showMessage(
            doc,
            "Please select your primary requirement.",
            false
          );
          return;
        }

        if (!message) {
          showMessage(
            doc,
            "Please enter your project details.",
            false
          );
          return;
        }

        if (message.length < 5) {
          showMessage(
            doc,
            "Please provide more details about your project.",
            false
          );
          return;
        }

        const submitButton = form.querySelector(
          "button[type='submit'], input[type='submit']"
        );

        const originalButtonText =
          submitButton?.textContent || "";

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.style.opacity = "0.6";
          submitButton.style.cursor = "not-allowed";

          if (submitButton.tagName === "BUTTON") {
            submitButton.textContent = "Submitting...";
          }
        }

        try {
          const response = await apiFetch(
            "/api/public/contact",
            {
              method: "POST",
              body: {
                customer_name: customerName,
                company: company || null,
                email: email || null,
                phone: phone || null,
                requirement,
                message,
              },
            }
          );

          let data = null;

          try {
            data = await response.json();
          } catch {
            data = null;
          }

          if (!response.ok) {
            let errorMessage =
              "Unable to submit your request.";

            if (Array.isArray(data?.detail)) {
              errorMessage = data.detail
                .map((error) => {
                  const location =
                    Array.isArray(error?.loc)
                      ? error.loc
                          .filter(Boolean)
                          .join(".")
                      : "field";

                  const message =
                    error?.msg || "Invalid value";

                  return `${location}: ${message}`;
                })
                .join("\n");
            } else if (
              typeof data?.detail === "string"
            ) {
              errorMessage = data.detail;
            } else if (
              data?.detail &&
              typeof data.detail === "object"
            ) {
              errorMessage =
                data.detail.msg ||
                JSON.stringify(data.detail);
            } else if (data?.message) {
              errorMessage = data.message;
            }

            throw new Error(errorMessage);
          }

          const leadCode =
            data?.lead_code ||
            data?.lead?.lead_code ||
            "Generated";

          showMessage(
            doc,
            `Request submitted successfully.\nReference: ${leadCode}`,
            true
          );

          form.reset();
        } catch (error) {
          console.error(
            "Contact submission failed:",
            error
          );

          showMessage(
            doc,
            error?.message ||
              "Something went wrong. Please try again.",
            false
          );
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = "1";
            submitButton.style.cursor = "";

            if (submitButton.tagName === "BUTTON") {
              submitButton.textContent =
                originalButtonText ||
                "Submit Request";
            }
          }
        }
      };

      form.addEventListener(
        "submit",
        submitHandler
      );
    };

    const handleLoad = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        setupPage();
      }, 300);
    };

    iframe.addEventListener(
      "load",
      handleLoad
    );

    if (
      iframe.contentDocument?.readyState ===
      "complete"
    ) {
      handleLoad();
    }

    return () => {
      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      cleanupForm();
    };
  }, []);

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <iframe
        ref={iframeRef}
        title="SKYTECH Contact Us"
        src="/stitch/contact_us_skytech_electricals/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}