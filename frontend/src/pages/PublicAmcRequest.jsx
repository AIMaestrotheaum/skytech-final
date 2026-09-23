import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function PublicAmcRequest() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return undefined;
    }

    let doc = null;
    let form = null;
    let submitHandler = null;
    let clickHandler = null;
    let loadTimeout = null;
    let mounted = true;
    let submitting = false;

    // ============================================================
    // Helpers
    // ============================================================

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    const getElementText = (element) => {
      if (!element) {
        return "";
      }

      const label =
        element.getAttribute("aria-label") || "";

      const placeholder =
        element.getAttribute("placeholder") || "";

      const name =
        element.getAttribute("name") || "";

      const id =
        element.getAttribute("id") || "";

      const value =
        element.value || "";

      return normalize(
        `${label} ${placeholder} ${name} ${id} ${value}`
      );
    };

    // ============================================================
    // Find field by keywords
    // ============================================================

    const findField = (keywords) => {
      if (!doc) {
        return null;
      }

      const fields = Array.from(
        doc.querySelectorAll(
          "input, textarea, select"
        )
      );

      // First try name/id/placeholder/aria-label
      for (const field of fields) {
        const text = getElementText(field);

        if (
          keywords.some((keyword) =>
            text.includes(normalize(keyword))
          )
        ) {
          return field;
        }
      }

      // Then try associated labels
      for (const field of fields) {
        const id = field.getAttribute("id");

        if (!id) {
          continue;
        }

        const label = doc.querySelector(
          `label[for="${CSS.escape(id)}"]`
        );

        const labelText = normalize(
          label?.textContent || ""
        );

        if (
          keywords.some((keyword) =>
            labelText.includes(
              normalize(keyword)
            )
          )
        ) {
          return field;
        }
      }

      return null;
    };

    const getValue = (keywords) => {
      const field = findField(keywords);

      if (!field) {
        return "";
      }

      return String(field.value || "").trim();
    };

    // ============================================================
    // Show message
    // ============================================================

    const showMessage = (
      message,
      type = "error"
    ) => {
      if (!doc?.body) {
        return;
      }

      let box =
        doc.getElementById(
          "skytech-amc-message"
        );

      if (!box) {
        box = doc.createElement("div");

        box.id =
          "skytech-amc-message";

        box.style.cssText = `
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 999999;
          max-width: 460px;
          padding: 15px 20px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          white-space: pre-line;
        `;

        doc.body.appendChild(box);
      }

      if (type === "success") {
        box.style.background =
          "#ecfdf5";

        box.style.color =
          "#047857";

        box.style.border =
          "1px solid #a7f3d0";
      } else {
        box.style.background =
          "#fef2f2";

        box.style.color =
          "#b91c1c";

        box.style.border =
          "1px solid #fecaca";
      }

      box.textContent = message;

      window.setTimeout(() => {
        if (box && box.parentNode) {
          box.remove();
        }
      }, 6000);
    };

    // ============================================================
    // Determine current step
    // ============================================================

    const getCurrentStep = () => {
      if (!doc?.body) {
        return 1;
      }

      const active =
        doc.querySelector(
          '[aria-current="step"], .active-step, .step.active'
        );

      if (active) {
        const text =
          active.textContent || "";

        const match =
          text.match(/[1-3]/);

        if (match) {
          return Number(match[0]);
        }
      }

      const bodyText =
        doc.body.innerText || "";

      if (
        bodyText.includes(
          "Problem Description"
        ) ||
        bodyText.includes(
          "Request Details"
        ) ||
        bodyText.includes(
          "SUBMIT REQUEST"
        )
      ) {
        return 3;
      }

      if (
        bodyText.includes("Equipment")
      ) {
        return 2;
      }

      return 1;
    };

    // ============================================================
    // Find final submit button
    // ============================================================

    const findSubmitButton = () => {
      if (!doc) {
        return null;
      }

      const buttons = Array.from(
        doc.querySelectorAll(
          "button, input[type='button'], input[type='submit']"
        )
      );

      return (
        buttons.find((button) => {
          const text = normalize(
            `${button.textContent || ""} ${
              button.value || ""
            } ${button.getAttribute(
              "aria-label"
            ) || ""}`
          );

          return (
            text.includes("submit request") ||
            text.includes("submit") ||
            text.includes("send request") ||
            text.includes("send enquiry") ||
            text.includes("send inquiry") ||
            text.includes("create request") ||
            text.includes("raise request")
          );
        }) || null
      );
    };

    // ============================================================
    // Checkbox validation
    // ============================================================

    const findVerificationCheckbox = () => {
      if (!doc) {
        return null;
      }

      const checkboxes = Array.from(
        doc.querySelectorAll(
          'input[type="checkbox"]'
        )
      );

      return (
        checkboxes.find((checkbox) => {
          const id =
            checkbox.getAttribute("id");

          const name =
            checkbox.getAttribute("name");

          const label =
            id
              ? doc.querySelector(
                  `label[for="${CSS.escape(id)}"]`
                )
              : null;

          const text = normalize(
            `${name || ""} ${
              checkbox.getAttribute(
                "aria-label"
              ) || ""
            } ${
              label?.textContent || ""
            }`
          );

          return (
            text.includes("verify") ||
            text.includes("authorize") ||
            text.includes("accurate") ||
            text.includes("information")
          );
        }) || null
      );
    };

    // ============================================================
    // API submission
    // ============================================================

    const submitRequest = async () => {
      if (!mounted || !doc || !form) {
        return;
      }

      if (submitting) {
        return;
      }

      // ----------------------------------------------------------
      // Read actual fields from Stitch page
      // ----------------------------------------------------------

      const customerName = getValue([
        "customer_name",
        "customer name",
        "customerName",
        "contact_person",
        "contact person",
        "contact-person",
        "contactperson",
        "full name",
        "full_name",
        "full-name",
        "name",
      ]);

      const company = getValue([
        "company",
        "company name",
        "company_name",
        "company-name",
        "organization",
        "organisation",
      ]);

      const email = getValue([
        "email",
        "email address",
        "email_address",
        "email-address",
        "customer email",
      ]);

      const phone = getValue([
        "phone",
        "phone number",
        "phone_number",
        "phone-number",
        "mobile",
        "mobile number",
        "mobile_number",
      ]);

      const issue = getValue([
        "issue",
        "problem",
        "problem description",
        "problem description requirements",
        "problem_description",
        "problem-description",
        "description",
        "requirements",
        "requirement",
        "request details",
        "request_details",
        "request-details",
        "details",
        "message",
      ]);

      // ----------------------------------------------------------
      // Request type
      // ----------------------------------------------------------

      let requestType = getValue([
        "request type",
        "request_type",
        "request-type",
        "requesttype",
      ]);

      if (!requestType) {
        const selected =
          doc.querySelector(
            `
            input[type="radio"]:checked,
            input[type="checkbox"]:checked,
            .selected,
            .active
            `
          );

        requestType =
          selected?.value ||
          selected?.textContent?.trim() ||
          "";
      }

      // ----------------------------------------------------------
      // Priority
      // ----------------------------------------------------------

      let priority = getValue([
        "priority",
      ]);

      priority = normalize(priority);

      const validPriorities = [
        "low",
        "normal",
        "high",
        "critical",
      ];

      if (
        !validPriorities.includes(
          priority
        )
      ) {
        priority = "normal";
      }

      // ----------------------------------------------------------
      // Validate name
      // ----------------------------------------------------------

      if (!customerName) {
        showMessage(
          "Please enter your name / contact person."
        );

        return;
      }

      // ----------------------------------------------------------
      // Validate email
      // ----------------------------------------------------------

      if (!email) {
        showMessage(
          "Please enter your email address."
        );

        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        showMessage(
          "Please enter a valid email address."
        );

        return;
      }

      // ----------------------------------------------------------
      // Validate issue
      // ----------------------------------------------------------

      if (!issue) {
        showMessage(
          "Please enter the problem description / requirements."
        );

        return;
      }

      // ----------------------------------------------------------
      // Validate authorization checkbox
      // ----------------------------------------------------------

      const verificationCheckbox =
        findVerificationCheckbox();

      if (
        verificationCheckbox &&
        !verificationCheckbox.checked
      ) {
        showMessage(
          "Please confirm that the information is accurate and authorize SKYTECH to process this request."
        );

        return;
      }

      const submitButton =
        findSubmitButton();

      let originalText = "";

      if (submitButton) {
        originalText =
          submitButton.tagName === "INPUT"
            ? submitButton.value
            : submitButton.textContent;
      }

      try {
        submitting = true;

        // --------------------------------------------------------
        // Disable submit
        // --------------------------------------------------------

        if (submitButton) {
          submitButton.disabled = true;

          submitButton.style.opacity =
            "0.6";

          submitButton.style.cursor =
            "not-allowed";

          if (
            submitButton.tagName === "INPUT"
          ) {
            submitButton.value =
              "Submitting...";
          } else {
            submitButton.textContent =
              "Submitting...";
          }
        }

        showMessage(
          "Submitting your request...",
          "success"
        );

        // --------------------------------------------------------
        // Send to FastAPI
        // --------------------------------------------------------

        const response = await apiFetch(
          "/api/public/amc-request",
          {
            method: "POST",
            body: {
              customer_name:
                customerName,

              company:
                company || null,

              email,

              phone:
                phone || null,

              issue,

              priority,
            },
          }
        );

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        // --------------------------------------------------------
        // Backend error
        // --------------------------------------------------------

        if (!response.ok) {
          let message =
            "Unable to submit your request.";

          if (
            Array.isArray(data?.detail)
          ) {
            message =
              data.detail
                .map((item) => {
                  const location =
                    Array.isArray(
                      item?.loc
                    )
                      ? item.loc.join(".")
                      : "";

                  return location
                    ? `${location}: ${
                        item?.msg ||
                        "Invalid value"
                      }`
                    : item?.msg ||
                      "Invalid value";
                })
                .join("\n");
          } else if (
            typeof data?.detail ===
            "string"
          ) {
            message = data.detail;
          } else if (
            typeof data?.message ===
            "string"
          ) {
            message = data.message;
          }

          throw new Error(message);
        }

        // --------------------------------------------------------
        // Successful submission
        // --------------------------------------------------------

        const requestCode =
          data?.request_code ||
          data?.service_request_code ||
          data?.code ||
          "";

        if (requestCode) {
          showMessage(
            `Request submitted successfully!\n\nYour Request Number is: ${requestCode}`,
            "success"
          );
        } else {
          showMessage(
            "Request submitted successfully!",
            "success"
          );
        }

        // Reset after successful submission
        if (
          typeof form.reset ===
          "function"
        ) {
          form.reset();
        }

      } catch (error) {
        console.error(
          "SKYTECH AMC request submission error:",
          error
        );

        showMessage(
          error?.message ||
            "Unable to submit your request. Please try again."
        );
      } finally {
        submitting = false;

        if (submitButton) {
          submitButton.disabled = false;

          submitButton.style.opacity =
            "1";

          submitButton.style.cursor =
            "";

          if (
            submitButton.tagName === "INPUT"
          ) {
            submitButton.value =
              originalText ||
              "SUBMIT REQUEST";
          } else {
            submitButton.textContent =
              originalText ||
              "SUBMIT REQUEST";
          }
        }
      }
    };

    // ============================================================
    // Form submit listener
    // ============================================================

    const attachHandlers = () => {
      if (!doc) {
        return;
      }

      form =
        doc.querySelector("form");

      if (!form) {
        console.warn(
          "SKYTECH: AMC form not found."
        );

        return;
      }

      // Prevent duplicate listeners
      if (
        form.dataset.skytechConnected ===
        "true"
      ) {
        return;
      }

      form.dataset.skytechConnected =
        "true";

      // ----------------------------------------------------------
      // Native submit
      // ----------------------------------------------------------

      submitHandler = (event) => {
        const step = getCurrentStep();

        /*
         * Only intercept native submit on
         * the final step.
         */

        if (step !== 3) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        submitRequest();
      };

      form.addEventListener(
        "submit",
        submitHandler,
        true
      );

      // ----------------------------------------------------------
      // Click handling
      // ----------------------------------------------------------

      clickHandler = (event) => {
        const button =
          event.target?.closest?.(
            "button, input[type='button'], input[type='submit']"
          );

        if (!button) {
          return;
        }

        const text =
          normalize(
            `${button.textContent || ""} ${
              button.value || ""
            } ${
              button.getAttribute(
                "aria-label"
              ) || ""
            }`
          );

        // --------------------------------------------------------
        // NEVER intercept navigation buttons
        // --------------------------------------------------------

        if (
          text === "next" ||
          text.includes("next") ||
          text.includes("back") ||
          text.includes("previous")
        ) {
          return;
        }

        // --------------------------------------------------------
        // Final submit button
        // --------------------------------------------------------

        const isSubmit =
          text.includes(
            "submit request"
          ) ||
          text === "submit" ||
          text.includes(
            "send request"
          ) ||
          text.includes(
            "send enquiry"
          ) ||
          text.includes(
            "send inquiry"
          ) ||
          text.includes(
            "create request"
          ) ||
          text.includes(
            "raise request"
          );

        if (!isSubmit) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        submitRequest();
      };

      doc.addEventListener(
        "click",
        clickHandler,
        true
      );

      console.log(
        "SKYTECH AMC request handler connected."
      );
    };

    // ============================================================
    // iframe load
    // ============================================================

    const handleLoad = () => {
      if (!mounted) {
        return;
      }

      if (loadTimeout) {
        window.clearTimeout(
          loadTimeout
        );
      }

      loadTimeout =
        window.setTimeout(() => {
          try {
            doc =
              iframe.contentDocument ||
              iframe.contentWindow?.document;

            if (!doc) {
              return;
            }

            attachHandlers();
          } catch (error) {
            console.error(
              "SKYTECH iframe initialization error:",
              error
            );
          }
        }, 300);
    };

    iframe.addEventListener(
      "load",
      handleLoad
    );

    // Already loaded
    if (
      iframe.contentDocument?.readyState ===
      "complete"
    ) {
      handleLoad();
    }

    // ============================================================
    // Cleanup
    // ============================================================

    return () => {
      mounted = false;

      if (loadTimeout) {
        window.clearTimeout(
          loadTimeout
        );
      }

      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (doc && clickHandler) {
        doc.removeEventListener(
          "click",
          clickHandler,
          true
        );
      }

      if (form && submitHandler) {
        form.removeEventListener(
          "submit",
          submitHandler,
          true
        );
      }

      doc = null;
      form = null;
      submitHandler = null;
      clickHandler = null;
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <iframe
        ref={iframeRef}
        src="/stitch/support_amc_requests_skytech/code.html"
        title="SKYTECH Service and AMC Request"
        style={{
          width: "100%",
          height: "100vh",
          minHeight: "700px",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
}