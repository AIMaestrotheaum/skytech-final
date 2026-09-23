import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function ThreePhaseUps() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return undefined;
    }

    let form = null;
    let submitHandler = null;
    let timeoutId = null;

    const getFieldValue = (inputs, keywords) => {
      for (const input of inputs) {
        const name =
          input.name?.toLowerCase() || "";
        const id =
          input.id?.toLowerCase() || "";
        const placeholder =
          input.placeholder?.toLowerCase() || "";
        const aria =
          input.getAttribute("aria-label")
            ?.toLowerCase() || "";

        const combined =
          `${name} ${id} ${placeholder} ${aria}`;

        if (
          keywords.some((keyword) =>
            combined.includes(keyword)
          )
        ) {
          const value = Number.parseFloat(
            input.value
          );

          if (Number.isFinite(value)) {
            return value;
          }
        }
      }

      return null;
    };

    const showMessage = (
      doc,
      message,
      success = true
    ) => {
      let resultBox = doc.querySelector(
        ".skytech-calculator-result"
      );

      if (!resultBox) {
        resultBox = doc.createElement("div");
        resultBox.className =
          "skytech-calculator-result";

        Object.assign(resultBox.style, {
          marginTop: "20px",
          padding: "16px",
          borderRadius: "10px",
          fontSize: "14px",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
          fontWeight: "600",
        });

        form?.appendChild(resultBox);
      }

      resultBox.textContent = message;

      resultBox.style.background = success
        ? "#e8f5e9"
        : "#ffebee";

      resultBox.style.color = success
        ? "#1b5e20"
        : "#b71c1c";
    };

    const cleanupForm = () => {
      if (form && submitHandler) {
        form.removeEventListener(
          "submit",
          submitHandler
        );
      }

      form = null;
      submitHandler = null;
    };

    const setupCalculator = () => {
      const doc = iframe.contentDocument;

      if (!doc) {
        return;
      }

      cleanupForm();

      form = doc.querySelector("form");

      if (!form) {
        console.warn(
          "Three-phase UPS calculator form not found."
        );
        return;
      }

      submitHandler = async (event) => {
        event.preventDefault();

        const inputs = Array.from(
          form.querySelectorAll("input")
        );

        let loadKw = getFieldValue(
          inputs,
          ["load", "kw"]
        );

        let powerFactor = getFieldValue(
          inputs,
          [
            "power factor",
            "power_factor",
            "pf",
          ]
        );

        let safetyMargin = getFieldValue(
          inputs,
          ["safety", "margin"]
        );

        let voltage = getFieldValue(
          inputs,
          ["voltage", "volt"]
        );

        if (powerFactor === null) {
          powerFactor = 0.8;
        }

        if (safetyMargin === null) {
          safetyMargin = 1.25;
        }

        if (voltage === null) {
          voltage = 415;
        }

        if (loadKw === null) {
          const firstNumericInput =
            inputs.find((input) =>
              Number.isFinite(
                Number.parseFloat(
                  input.value
                )
              )
            );

          if (firstNumericInput) {
            loadKw = Number.parseFloat(
              firstNumericInput.value
            );
          }
        }

        if (
          !Number.isFinite(loadKw) ||
          loadKw <= 0
        ) {
          showMessage(
            doc,
            "Please enter a valid load in kW.",
            false
          );
          return;
        }

        if (
          !Number.isFinite(powerFactor) ||
          powerFactor <= 0 ||
          powerFactor > 1
        ) {
          showMessage(
            doc,
            "Power factor must be greater than 0 and at most 1.",
            false
          );
          return;
        }

        if (
          !Number.isFinite(safetyMargin) ||
          safetyMargin < 1 ||
          safetyMargin > 5
        ) {
          showMessage(
            doc,
            "Safety margin must be between 1 and 5.",
            false
          );
          return;
        }

        if (
          !Number.isFinite(voltage) ||
          voltage <= 0
        ) {
          showMessage(
            doc,
            "Please enter a valid voltage.",
            false
          );
          return;
        }

        const submitButton =
          form.querySelector(
            'button[type="submit"], input[type="submit"]'
          );

        const originalButtonText =
          submitButton?.tagName === "INPUT"
            ? submitButton.value
            : submitButton?.textContent;

        try {
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.style.opacity = "0.6";
            submitButton.style.cursor =
              "not-allowed";

            if (
              submitButton.tagName ===
              "BUTTON"
            ) {
              submitButton.textContent =
                "Calculating...";
            }

            if (
              submitButton.tagName ===
              "INPUT"
            ) {
              submitButton.value =
                "Calculating...";
            }
          }

          const response = await apiFetch(
            "/api/public/three-phase-ups",
            {
              method: "POST",
              body: {
                load_kw: loadKw,
                power_factor: powerFactor,
                safety_margin: safetyMargin,
                voltage,
              },
            }
          );

          let data = {};

          try {
            data = await response.json();
          } catch {
            data = {};
          }

          if (!response.ok) {
            let errorMessage =
              "Unable to calculate three-phase UPS requirement.";

            if (
              Array.isArray(data?.detail)
            ) {
              errorMessage = data.detail
                .map((error) => {
                  const location =
                    Array.isArray(error?.loc)
                      ? error.loc
                          .filter(Boolean)
                          .join(".")
                      : "field";

                  const message =
                    error?.msg ||
                    "Invalid value";

                  return `${location}: ${message}`;
                })
                .join("\n");
            } else if (
              typeof data?.detail ===
              "string"
            ) {
              errorMessage = data.detail;
            } else if (
              data?.message
            ) {
              errorMessage =
                data.message;
            }

            throw new Error(
              errorMessage
            );
          }

          const resultText =
            Object.entries(data || {})
              .map(([key, value]) => {
                const label = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                  );

                return `${label}: ${value}`;
              })
              .join("\n");

          showMessage(
            doc,
            `Three-Phase UPS Calculation Result\n\n${resultText}`,
            true
          );
        } catch (error) {
          console.error(
            "Three-Phase UPS Calculator Error:",
            error
          );

          showMessage(
            doc,
            error?.message ||
              "Unable to connect to SKYTECH server.",
            false
          );
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = "1";
            submitButton.style.cursor = "";

            if (
              submitButton.tagName ===
              "BUTTON"
            ) {
              submitButton.textContent =
                originalButtonText ||
                "Calculate";
            }

            if (
              submitButton.tagName ===
              "INPUT"
            ) {
              submitButton.value =
                originalButtonText ||
                "Calculate";
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
        setupCalculator();
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
        title="SKYTECH Three-Phase UPS Calculator"
        src="/stitch/three_phase_ups_skytech_electricals/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}