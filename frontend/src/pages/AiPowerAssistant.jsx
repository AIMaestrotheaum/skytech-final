import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function AiPowerAssistant() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return;

    let form = null;
    let submitHandler = null;
    let timeoutId = null;

    const handleLoad = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        const doc = iframe.contentDocument;

        if (!doc) return;

        form = doc.querySelector("form");

        if (!form) {
          console.warn(
            "AI Power Assistant form not found."
          );
          return;
        }

        submitHandler = async (event) => {
          event.preventDefault();

          /*
           * Find the question input.
           */
          const input =
            form.querySelector("textarea") ||
            form.querySelector(
              'input[type="text"]'
            ) ||
            form.querySelector(
              'input:not([type="hidden"])'
            );

          if (!input) {
            console.error(
              "AI assistant question input not found."
            );
            return;
          }

          const question =
            input.value.trim();

          if (!question) {
            alert(
              "Please enter your question."
            );
            return;
          }

          try {
            /*
             * API REQUEST
             */
            const response =
              await apiFetch(
                "/api/public/ai-power-assistant",
                {
                  method: "POST",
                  body: {
                    question,
                  },
                }
              );

            /*
             * Read response safely.
             */
            let data = null;

            try {
              data =
                await response.json();
            } catch {
              data = null;
            }

            console.log(
              "AI Power Assistant API status:",
              response.status
            );

            console.log(
              "AI Power Assistant API:",
              data
            );

            if (!response.ok) {
              /*
               * FastAPI validation errors.
               */
              if (
                Array.isArray(
                  data?.detail
                )
              ) {
                const errorMessage =
                  data.detail
                    .map((error) => {
                      const location =
                        Array.isArray(
                          error?.loc
                        )
                          ? error.loc
                              .filter(
                                Boolean
                              )
                              .join(".")
                          : "field";

                      const message =
                        error?.msg ||
                        "Invalid value";

                      return `${location}: ${message}`;
                    })
                    .join("\n");

                alert(errorMessage);
              }

              /*
               * Normal FastAPI error.
               */
              else if (
                typeof data?.detail ===
                "string"
              ) {
                alert(data.detail);
              }

              /*
               * Object-style error.
               */
              else if (
                data?.detail &&
                typeof data.detail ===
                  "object"
              ) {
                alert(
                  data.detail.msg ||
                    JSON.stringify(
                      data.detail,
                      null,
                      2
                    )
                );
              }

              /*
               * Generic API error.
               */
              else {
                alert(
                  data?.message ||
                    "Unable to get an answer."
                );
              }

              return;
            }

            /*
             * DISPLAY RESPONSE
             */
            const main =
              doc.querySelector("main") ||
              doc.body;

            const answer =
              data?.answer ||
              data?.response ||
              data?.message ||
              "";

            if (!answer) {
              alert(
                JSON.stringify(
                  data,
                  null,
                  2
                )
              );

              return;
            }

            /*
             * Look for an existing answer/result
             * container.
             */
            const resultCandidates = [
              ...main.querySelectorAll(
                '[class*="answer"], [class*="response"], [class*="result"]'
              ),
            ];

            const resultElement =
              resultCandidates.find(
                (element) =>
                  element.children.length === 0 ||
                  element.children.length <= 1
              );

            if (resultElement) {
              resultElement.textContent =
                answer;
            } else {
              /*
               * Fallback: show the API response
               * without changing the Stitch page.
               */
              alert(answer);
            }
          } catch (error) {
            console.error(
              "AI Power Assistant Error:",
              error
            );

            alert(
              error?.message ||
                "Unable to connect to SKYTECH server."
            );
          }
        };

        form.addEventListener(
          "submit",
          submitHandler
        );
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

      if (
        form &&
        submitHandler
      ) {
        form.removeEventListener(
          "submit",
          submitHandler
        );
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <iframe
        ref={iframeRef}
        title="SKYTECH AI Power Assistant"
        src="/stitch/ai_power_assistant_skytech_electricals/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}