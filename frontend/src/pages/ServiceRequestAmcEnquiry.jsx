import { useCallback } from "react";

import CustomerPortalShell from "../components/CustomerPortalShell";
import { apiFetch } from "../utils/api";

/*
|--------------------------------------------------------------------------
| Service / AMC Request
|--------------------------------------------------------------------------
| Customer Portal version.
|
| The original Stitch Service/AMC page is loaded inside the
| Customer Portal main area so the customer sidebar remains visible.
|--------------------------------------------------------------------------
*/

function getApiErrorMessage(response) {
  const fallback = `Request failed with status ${response.status}.`;

  return response
    .json()
    .then((data) => {
      if (typeof data?.detail === "string") {
        return data.detail;
      }

      if (Array.isArray(data?.detail)) {
        return data.detail
          .map((item) => item?.msg || "Validation error")
          .join(", ");
      }

      return fallback;
    })
    .catch(() => fallback);
}

function findInput(doc, keywords) {
  const elements = Array.from(
    doc.querySelectorAll("input, textarea, select")
  );

  return (
    elements.find((element) => {
      const text = `
        ${element.getAttribute("name") || ""}
        ${element.getAttribute("id") || ""}
        ${element.getAttribute("placeholder") || ""}
        ${element.getAttribute("aria-label") || ""}
      `.toLowerCase();

      return keywords.some((keyword) =>
        text.includes(keyword.toLowerCase())
      );
    }) || null
  );
}

function getFieldValue(doc, keywords) {
  const element = findInput(doc, keywords);

  if (!element) {
    return "";
  }

  return String(element.value || "").trim();
}

function setFormMessage(doc, form, message, success = false) {
  let messageElement = doc.getElementById(
    "skytech-amc-form-message"
  );

  if (!messageElement) {
    messageElement = doc.createElement("div");

    messageElement.id = "skytech-amc-form-message";

    messageElement.style.cssText = `
      margin: 16px 0;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: Inter, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    `;

    if (form) {
      form.insertBefore(messageElement, form.firstChild);
    } else {
      doc.body.prepend(messageElement);
    }
  }

  messageElement.textContent = message;

  messageElement.style.background = success
    ? "#ecfdf5"
    : "#fef2f2";

  messageElement.style.color = success
    ? "#047857"
    : "#b91c1c";

  messageElement.style.border = success
    ? "1px solid #a7f3d0"
    : "1px solid #fecaca";
}

async function loadStitchContent(doc) {
  const response = await fetch(
    "/stitch/support_amc_requests_skytech/code.html"
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load Service & AMC page (${response.status}).`
    );
  }

  const html = await response.text();

  const parser = new DOMParser();

  const sourceDoc = parser.parseFromString(
    html,
    "text/html"
  );

  /*
  |--------------------------------------------------------------------------
  | Copy Stitch styles
  |--------------------------------------------------------------------------
  */

  sourceDoc
    .querySelectorAll("style")
    .forEach((style) => {
      const copiedStyle = doc.createElement("style");

      copiedStyle.textContent = style.textContent;

      copiedStyle.dataset.skytechCopied = "amc-style";

      doc.head.appendChild(copiedStyle);
    });

  sourceDoc
    .querySelectorAll('link[rel="stylesheet"]')
    .forEach((link) => {
      const href = link.getAttribute("href");

      if (!href) {
        return;
      }

      const exists = Array.from(
        doc.querySelectorAll('link[rel="stylesheet"]')
      ).some(
        (existing) =>
          existing.getAttribute("href") === href
      );

      if (!exists) {
        const copiedLink = doc.createElement("link");

        copiedLink.rel = "stylesheet";
        copiedLink.href = href;

        copiedLink.dataset.skytechCopied = "amc-style";

        doc.head.appendChild(copiedLink);
      }
    });

  /*
  |--------------------------------------------------------------------------
  | Find Stitch content
  |--------------------------------------------------------------------------
  */

  let sourceContent =
    sourceDoc.querySelector(".main");

  if (!sourceContent) {
    sourceContent =
      sourceDoc.querySelector("main");
  }

  if (!sourceContent) {
    sourceContent =
      sourceDoc.querySelector('[role="main"]');
  }

  if (!sourceContent) {
    sourceContent = sourceDoc.body;
  }

  const clonedContent =
    sourceContent.cloneNode(true);

  /*
  |--------------------------------------------------------------------------
  | Remove public website navigation
  |--------------------------------------------------------------------------
  */

  clonedContent
    .querySelectorAll(
      `
      header,
      nav,
      footer,
      .navbar,
      .nav,
      .navigation,
      .site-header,
      .site-footer
      `
    )
    .forEach((element) => {
      element.remove();
    });

  /*
  |--------------------------------------------------------------------------
  | Insert into customer portal main
  |--------------------------------------------------------------------------
  */

  const customerMain =
    doc.querySelector(".main");

  if (!customerMain) {
    throw new Error(
      "Customer portal main container was not found."
    );
  }

  customerMain.innerHTML = "";

  customerMain.appendChild(clonedContent);

  /*
  |--------------------------------------------------------------------------
  | Responsive adjustments
  |--------------------------------------------------------------------------
  */

  const wrapperStyle = doc.createElement("style");

  wrapperStyle.dataset.skytechCopied =
    "amc-wrapper";

  wrapperStyle.textContent = `
    .main > * {
      box-sizing: border-box;
    }

    .main img {
      max-width: 100%;
    }

    .main form {
      max-width: 100%;
    }

    .main input,
    .main textarea,
    .main select,
    .main button {
      box-sizing: border-box;
    }

    @media (max-width: 768px) {
      .main {
        overflow-x: hidden !important;
      }

      .main > * {
        max-width: 100% !important;
      }
    }
  `;

  doc.head.appendChild(wrapperStyle);
}

export default function ServiceRequestAmcEnquiry() {
  const submitRequest = useCallback(
    async (doc, form, submitButton) => {
      if (!doc || !form) {
        return;
      }

      const customerName = getFieldValue(doc, [
        "customer_name",
        "customer-name",
        "full name",
        "customer",
        "name",
      ]);

      const company = getFieldValue(doc, [
        "company",
        "company_name",
        "company-name",
        "organization",
      ]);

      const issue = getFieldValue(doc, [
        "issue",
        "problem",
        "message",
        "description",
        "requirement",
        "request",
      ]);

      const priority =
        getFieldValue(doc, ["priority"]) ||
        "normal";

      if (!customerName) {
        setFormMessage(
          doc,
          form,
          "Please enter your name."
        );
        return;
      }

      if (!issue) {
        setFormMessage(
          doc,
          form,
          "Please describe your service or AMC requirement."
        );
        return;
      }

      const allowedPriorities = [
        "low",
        "normal",
        "high",
        "critical",
      ];

      const normalizedPriority =
        priority.toLowerCase().trim();

      const finalPriority =
        allowedPriorities.includes(
          normalizedPriority
        )
          ? normalizedPriority
          : "normal";

      const payload = {
        customer_name: customerName,
        company: company || null,
        issue,
        priority: finalPriority,
      };

      try {
        if (submitButton) {
          submitButton.disabled = true;

          submitButton.dataset.originalText =
            submitButton.textContent ||
            submitButton.value ||
            "Submit";

          if (
            submitButton.tagName === "INPUT"
          ) {
            submitButton.value = "Submitting...";
          } else {
            submitButton.textContent =
              "Submitting...";
          }
        }

        setFormMessage(
          doc,
          form,
          "Submitting your request..."
        );

        const response = await apiFetch(
          "/api/public/amc-request",
          {
            method: "POST",
            body: payload,
          }
        );

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response)
          );
        }

        const data = await response.json();

        const requestCode =
          data?.request_code ||
          data?.service_request_code ||
          "";

        setFormMessage(
          doc,
          form,
          requestCode
            ? `Request submitted successfully. Your request number is ${requestCode}.`
            : "Your service request has been submitted successfully.",
          true
        );

        if (
          typeof form.reset === "function"
        ) {
          form.reset();
        }
      } catch (error) {
        console.error(
          "SKYTECH Service/AMC request error:",
          error
        );

        setFormMessage(
          doc,
          form,
          error?.message ||
            "Unable to submit your request. Please try again."
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;

          const originalText =
            submitButton.dataset.originalText ||
            "Submit";

          if (
            submitButton.tagName === "INPUT"
          ) {
            submitButton.value = originalText;
          } else {
            submitButton.textContent =
              originalText;
          }
        }
      }
    },
    []
  );

  const handleReady = useCallback(
    async (doc) => {
      if (!doc) {
        return;
      }

      try {
        await loadStitchContent(doc);

        const form =
          doc.querySelector("form");

        if (!form) {
          console.warn(
            "SKYTECH: Service/AMC form was not found."
          );
          return;
        }

        if (
          form.dataset.skytechAmcBound ===
          "true"
        ) {
          return;
        }

        form.dataset.skytechAmcBound = "true";

        const submitButton =
          Array.from(
            form.querySelectorAll(
              "button, input[type='submit']"
            )
          ).find((button) => {
            const text = `
              ${button.textContent || ""}
              ${button.value || ""}
            `.toLowerCase();

            return (
              text.includes("submit") ||
              text.includes("request") ||
              text.includes("send")
            );
          }) || null;

        const submitHandler = (event) => {
          event.preventDefault();
          event.stopPropagation();

          submitRequest(
            doc,
            form,
            submitButton
          );
        };

        form.addEventListener(
          "submit",
          submitHandler
        );

        if (submitButton) {
          submitButton.addEventListener(
            "click",
            (event) => {
              if (
                submitButton.type !== "submit"
              ) {
                event.preventDefault();

                submitRequest(
                  doc,
                  form,
                  submitButton
                );
              }
            }
          );
        }
      } catch (error) {
        console.error(
          "SKYTECH Service/AMC page error:",
          error
        );
      }
    },
    [submitRequest]
  );

  return (
    <CustomerPortalShell
      activeRoute="/portal/service-request"
      title="SKYTECH Service and AMC Request"
      onReady={handleReady}
    />
  );
}