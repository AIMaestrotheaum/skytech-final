import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function BatteryCalculator() {
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
          "Battery calculator form not found."
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

        let backupMinutes = getFieldValue(
          inputs,
          ["backup", "minute", "time"]
        );

        let batteryVoltage = getFieldValue(
          inputs,
          ["voltage", "volt"]
        );

        let batteryAh = getFieldValue(
          inputs,
          ["ah", "amp"]
        );

        let efficiency = getFieldValue(
          inputs,
          ["efficiency", "eff"]
        );

        let depthOfDischarge =
          getFieldValue(
            inputs,
            ["depth", "dod"]
          );

        if (batteryVoltage === null) {
          batteryVoltage = 12;
        }

        if (batteryAh === null) {
          batteryAh = 100;
        }

        if (efficiency === null) {
          efficiency = 0.9;
        }

        if (
          depthOfDischarge === null
        ) {
          depthOfDischarge = 0.8;
        }

        const numericInputs = inputs.filter(
          (input) =>
            Number.isFinite(
              Number.parseFloat(
                input.value
              )
            )
        );

        if (
          loadKw === null &&
          numericInputs[0]
        ) {
          loadKw = Number.parseFloat(
            numericInputs[0].value
          );
        }

        if (
          backupMinutes === null &&
          numericInputs[1]
        ) {
          backupMinutes =
            Number.parseFloat(
              numericInputs[1].value
            );
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
          !Number.isFinite(backupMinutes) ||
          backupMinutes <= 0
        ) {
          showMessage(
            doc,
            "Please enter a valid backup time.",
            false
          );
          return;
        }

        if (
          !Number.isFinite(
            batteryVoltage
          ) ||
          batteryVoltage <= 0
        ) {
          showMessage(
            doc,
            "Please enter a valid battery voltage.",
            false
          );
          return;
        }

        if (
          !Number.isFinite(batteryAh) ||
          batteryAh <= 0
        ) {
          showMessage(
            doc,
            "Please enter a valid battery Ah value.",
            false
          );
          return;
        }

        if (
          !Number.isFinite(efficiency) ||
          efficiency <= 0 ||
          efficiency > 1
        ) {
          showMessage(
            doc,
            "Efficiency must be greater than 0 and at most 1.",
            false
          );
          return;
        }

        if (
          !Number.isFinite(
            depthOfDischarge
          ) ||
          depthOfDischarge <= 0 ||
          depthOfDischarge > 1
        ) {
          showMessage(
            doc,
            "Depth of discharge must be greater than 0 and at most 1.",
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
            "/api/public/battery-calculator",
            {
              method: "POST",
              body: {
                load_kw: loadKw,
                backup_minutes:
                  backupMinutes,
                battery_voltage:
                  batteryVoltage,
                battery_ah: batteryAh,
                efficiency,
                depth_of_discharge:
                  depthOfDischarge,
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
              "Unable to calculate battery requirement.";

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
            `Battery Calculation Result\n\n${resultText}`,
            true
          );
        } catch (error) {
          console.error(
            "Battery Calculator Error:",
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
        title="SKYTECH Battery Calculator"
        src="/stitch/battery_calculator_skytech_electricals/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}