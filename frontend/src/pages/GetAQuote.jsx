import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function GetAQuote() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return undefined;

    let form = null;
    let submitHandler = null;
    let timeoutId = null;

    const findField = (doc, keywords) => {
      const fields = Array.from(
        doc.querySelectorAll("input, textarea, select")
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

    const handleSubmit = async (event, doc) => {
      event.preventDefault();

      const submitButton = form?.querySelector(
        "button[type='submit'], input[type='submit']"
      );

      const customerNameField = findField(doc, [
        "customer name",
        "full name",
        "name",
      ]);

      const companyField = findField(doc, [
        "company name",
        "company",
        "organization",
      ]);

      const emailField = findField(doc, [
        "email address",
        "email",
      ]);

      const phoneField = findField(doc, [
        "phone",
        "mobile",
        "contact number",
      ]);

      const industryField = findField(doc, [
        "industry",
      ]);

      const requirementField = findField(doc, [
        "requirement",
        "message",
        "description",
        "details",
      ]);

      const customerName = customerNameField?.value?.trim() || "";
      const company = companyField?.value?.trim() || "";
      const email = emailField?.value?.trim() || "";
      const phone = phoneField?.value?.trim() || "";
      const industry = industryField?.value?.trim() || "";
      const requirement = requirementField?.value?.trim() || "";

      if (!customerName || !email || !requirement) {
        showMessage(
          doc,
          "Please fill all required fields.",
          false
        );
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        showMessage(
          doc,
          "Please enter a valid email address.",
          false
        );
        return;
      }

      if (requirement.length < 5) {
        showMessage(
          doc,
          "Please provide more details about your requirement.",
          false
        );
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.style.opacity = "0.6";
        submitButton.style.cursor = "not-allowed";
      }

      try {
        const response = await apiFetch("/api/public/quote", {
          method: "POST",
          body: {
            customer_name: customerName,
            company: company || null,
            email,
            phone: phone || null,
            industry: industry || null,
            requirement,
            source: "website",
          },
        });

        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          let errorMessage = "Unable to submit quote request.";

          if (Array.isArray(data?.detail)) {
            errorMessage = data.detail
              .map((error) => {
                const location = Array.isArray(error?.loc)
                  ? error.loc.filter(Boolean).join(".")
                  : "field";

                const message = error?.msg || "Invalid value";

                return `${location}: ${message}`;
              })
              .join("\n");
          } else if (typeof data?.detail === "string") {
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
          `Quote request submitted successfully.\nReference: ${leadCode}`,
          true
        );

        form.reset();
      } catch (error) {
        console.error("Get Quote Error:", error);

        showMessage(
          doc,
          error.message ||
            "Something went wrong. Please try again.",
          false
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.style.opacity = "1";
          submitButton.style.cursor = "";
        }
      }
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

      if (!doc) return;

      cleanupForm();

      const forms = Array.from(doc.querySelectorAll("form"));

      form =
        forms.find((candidate) => {
          const text =
            candidate.textContent?.toLowerCase() || "";

          return (
            text.includes("quote") ||
            text.includes("requirement")
          );
        }) ||
        forms[0] ||
        null;

      if (!form) {
        console.error("Get Quote form not found.");
        return;
      }

      submitHandler = (event) => {
        handleSubmit(event, doc);
      };

      form.addEventListener("submit", submitHandler);
    };

    const handleLoad = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        setupPage();
      }, 300);
    };

    iframe.addEventListener("load", handleLoad);

    if (iframe.contentDocument?.readyState === "complete") {
      handleLoad();
    }

    return () => {
      iframe.removeEventListener("load", handleLoad);

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
        title="SKYTECH Get a Quote"
        src="/stitch/get_a_quote_skytech_electricals/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}