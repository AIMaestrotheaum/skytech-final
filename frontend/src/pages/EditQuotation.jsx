import { useEffect, useRef } from "react";

import { apiFetch } from "../utils/api";

export default function EditQuotation() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return;

    let timeoutId = null;

    const quoteId =
      sessionStorage.getItem("selected_quote_id");

    if (!quoteId) {
      console.error(
        "No selected quote ID found."
      );
      return;
    }

    // =========================================================
    // FIND TEXT
    // =========================================================

    const findTextElement = (doc, text) => {
      const elements = Array.from(
        doc.querySelectorAll("*")
      );

      return elements.find(
        (el) =>
          el.children.length === 0 &&
          el.textContent.trim() === text
      );
    };

    // =========================================================
    // REPLACE TEXT
    // =========================================================

    const replaceText = (
      doc,
      oldText,
      newText
    ) => {
      const element =
        findTextElement(
          doc,
          oldText
        );

      if (element) {
        element.textContent =
          newText ?? "-";

        return element;
      }

      return null;
    };

    // =========================================================
    // FIND INPUT
    // =========================================================

    const findInput = (
      doc,
      keywords
    ) => {
      const inputs = Array.from(
        doc.querySelectorAll(
          "input"
        )
      );

      return (
        inputs.find((input) => {
          const placeholder =
            input
              .getAttribute(
                "placeholder"
              )
              ?.toLowerCase() || "";

          const name =
            input
              .getAttribute("name")
              ?.toLowerCase() || "";

          const id =
            input
              .getAttribute("id")
              ?.toLowerCase() || "";

          const aria =
            input
              .getAttribute(
                "aria-label"
              )
              ?.toLowerCase() || "";

          const combined =
            `${placeholder} ${name} ${id} ${aria}`;

          return keywords.some(
            (keyword) =>
              combined.includes(
                keyword
              )
          );
        }) || null
      );
    };

    // =========================================================
    // SET INPUT VALUE
    // =========================================================

    const setInputValue = (
      doc,
      keywords,
      value
    ) => {
      const input = findInput(
        doc,
        keywords
      );

      if (input) {
        input.value =
          value ?? "";

        input.dispatchEvent(
          new Event("input", {
            bubbles: true,
          })
        );

        input.dispatchEvent(
          new Event("change", {
            bubbles: true,
          })
        );

        return input;
      }

      return null;
    };

    // =========================================================
    // FIND STATUS SELECT
    // =========================================================

    const findStatusSelect = (
      doc
    ) => {
      const selects = Array.from(
        doc.querySelectorAll(
          "select"
        )
      );

      return (
        selects.find((select) => {
          const name =
            select
              .getAttribute("name")
              ?.toLowerCase() || "";

          const id =
            select
              .getAttribute("id")
              ?.toLowerCase() || "";

          const aria =
            select
              .getAttribute(
                "aria-label"
              )
              ?.toLowerCase() || "";

          const parentText =
            select.parentElement
              ?.textContent
              ?.toLowerCase() || "";

          const combined =
            `${name} ${id} ${aria} ${parentText}`;

          return combined.includes(
            "status"
          );
        }) || null
      );
    };

    // =========================================================
    // SET STATUS
    // =========================================================

    const setStatusValue = (
      doc,
      status
    ) => {
      const select =
        findStatusSelect(doc);

      if (!select) {
        return null;
      }

      const target =
        String(
          status || ""
        ).toLowerCase();

      const matchingOption =
        Array.from(
          select.options
        ).find(
          (option) =>
            option.value
              .toLowerCase() ===
              target ||
            option.textContent
              .trim()
              .toLowerCase() ===
              target
        );

      if (matchingOption) {
        select.value =
          matchingOption.value;

        select.dispatchEvent(
          new Event("change", {
            bubbles: true,
          })
        );
      }

      return select;
    };

    // =========================================================
    // FORMAT AMOUNT
    // =========================================================

    const formatAmount = (
      amount
    ) => {
      if (
        amount === null ||
        amount === undefined ||
        amount === ""
      ) {
        return "-";
      }

      const numericAmount =
        Number(amount);

      if (
        Number.isNaN(
          numericAmount
        )
      ) {
        return "-";
      }

      return `₹${numericAmount.toLocaleString(
        "en-IN"
      )}`;
    };

    // =========================================================
    // CREATE SAVE MESSAGE
    // =========================================================

    const createSaveArea = (
      doc
    ) => {
      const existing =
        doc.querySelector(
          "#skytech-quote-save-area"
        );

      if (existing) {
        return existing;
      }

      const main =
        doc.querySelector(
          "main"
        ) || doc.body;

      const area =
        doc.createElement(
          "div"
        );

      area.id =
        "skytech-quote-save-area";

      area.style.cssText = `
        margin: 24px 0;
        padding: 20px;
        border: 1px solid #c5c6cd;
        border-radius: 10px;
        background: #ffffff;
        font-family: Inter, Arial, sans-serif;
      `;

      area.innerHTML = `
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            flex-wrap:wrap;
          "
        >
          <div>
            <div
              style="
                font-size:18px;
                font-weight:700;
                color:#0d1c32;
              "
            >
              Update Quotation
            </div>

            <div
              style="
                margin-top:5px;
                font-size:13px;
                color:#666;
              "
            >
              Save the quotation amount and status.
            </div>
          </div>

          <button
            id="skytech-save-quote"
            type="button"
            style="
              border:0;
              border-radius:7px;
              padding:11px 20px;
              background:#0050cc;
              color:#fff;
              font-weight:600;
              cursor:pointer;
            "
          >
            Save Changes
          </button>
        </div>

        <div
          id="skytech-quote-message"
          style="
            margin-top:12px;
            font-size:14px;
            font-weight:500;
          "
        ></div>
      `;

      main.prepend(area);

      return area;
    };

    // =========================================================
    // RENDER QUOTE
    // =========================================================

    const renderQuote = (
      doc,
      quote
    ) => {
      console.log(
        "Rendering quote:",
        quote
      );

      // -------------------------------------------------------
      // QUOTE CODE
      // -------------------------------------------------------

      replaceText(
        doc,
        "QT-2024-001",
        quote.quote_code
      );

      replaceText(
        doc,
        "QT-2024-8901",
        quote.quote_code
      );

      // -------------------------------------------------------
      // CUSTOMER
      // -------------------------------------------------------

      replaceText(
        doc,
        "Acme Manufacturing Corp.",
        quote.company
      );

      replaceText(
        doc,
        "Acme Industrial Upgrade",
        quote.customer_name
      );

      // -------------------------------------------------------
      // AMOUNT
      // -------------------------------------------------------

      const formattedAmount =
        formatAmount(
          quote.amount
        );

      replaceText(
        doc,
        "₹0",
        formattedAmount
      );

      replaceText(
        doc,
        "₹100,000",
        formattedAmount
      );

      // -------------------------------------------------------
      // STATUS
      // -------------------------------------------------------

      replaceText(
        doc,
        "Pending",
        quote.status
      );

      replaceText(
        doc,
        "pending",
        quote.status
      );

      // -------------------------------------------------------
      // DATE
      // -------------------------------------------------------

      if (quote.created_at) {
        const formattedDate =
          new Date(
            quote.created_at
          ).toLocaleDateString(
            "en-IN"
          );

        replaceText(
          doc,
          "01/01/2024",
          formattedDate
        );

        replaceText(
          doc,
          "01 Jan 2024",
          formattedDate
        );
      }

      // -------------------------------------------------------
      // FORM FIELDS
      // -------------------------------------------------------

      setInputValue(
        doc,
        [
          "quote code",
          "quote number",
          "quotation number",
        ],
        quote.quote_code
      );

      setInputValue(
        doc,
        [
          "customer name",
          "client name",
        ],
        quote.customer_name
      );

      setInputValue(
        doc,
        [
          "company",
          "company name",
        ],
        quote.company
      );

      const amountInput =
        setInputValue(
          doc,
          [
            "amount",
            "total",
            "price",
          ],
          quote.amount
        );

      if (amountInput) {
        amountInput.type = "number";
        amountInput.min = "0";
        amountInput.step = "0.01";
      }

      // -------------------------------------------------------
      // STATUS SELECT
      // -------------------------------------------------------

      setStatusValue(
        doc,
        quote.status
      );

      // -------------------------------------------------------
      // SAVE AREA
      // -------------------------------------------------------

      createSaveArea(
        doc
      );
    };

    // =========================================================
    // SAVE QUOTE
    // =========================================================

    const setupSaveButton = (
      doc
    ) => {
      const saveButton =
        doc.querySelector(
          "#skytech-save-quote"
        );

      const message =
        doc.querySelector(
          "#skytech-quote-message"
        );

      if (
        !saveButton ||
        !message
      ) {
        return;
      }

      // Prevent duplicate listener
      if (
        saveButton.dataset.connected ===
        "true"
      ) {
        return;
      }

      saveButton.dataset.connected =
        "true";

      saveButton.addEventListener(
        "click",
        async () => {
          try {
            const amountInput =
              findInput(
                doc,
                [
                  "amount",
                  "total",
                  "price",
                ]
              );

            const statusSelect =
              findStatusSelect(
                doc
              );

            if (!amountInput) {
              throw new Error(
                "Quotation amount field not found."
              );
            }

            if (!statusSelect) {
              throw new Error(
                "Quotation status field not found."
              );
            }

            const amountValue =
              amountInput.value
                .trim();

            const statusValue =
              statusSelect.value;

            if (
              amountValue === ""
            ) {
              throw new Error(
                "Please enter a quotation amount."
              );
            }

            const amount =
              Number(
                amountValue
              );

            if (
              Number.isNaN(
                amount
              ) ||
              amount < 0
            ) {
              throw new Error(
                "Quotation amount must be a valid non-negative number."
              );
            }

            saveButton.disabled =
              true;

            saveButton.textContent =
              "Saving...";

            message.textContent =
              "";

            // -------------------------------------------------
            // PUT REQUEST
            // -------------------------------------------------

            const response =
              await apiFetch(
                `/api/admin/quotes/${quoteId}`,
                {
                  method: "PUT",
                  body: {
                    amount,
                    status:
                      statusValue ||
                      null,
                  },
                }
              );

            if (!response.ok) {
              let errorMessage =
                `Quote update failed: ${response.status}`;

              try {
                const errorData =
                  await response.json();

                if (
                  typeof errorData.detail ===
                  "string"
                ) {
                  errorMessage =
                    errorData.detail;
                }
              } catch {
                // Keep default message
              }

              throw new Error(
                errorMessage
              );
            }

            const updatedQuote =
              await response.json();

            console.log(
              "Updated quotation:",
              updatedQuote
            );

            // -------------------------------------------------
            // UPDATE DISPLAY
            // -------------------------------------------------

            renderQuote(
              doc,
              updatedQuote
            );

            message.textContent =
              "Quotation updated successfully.";

            message.style.color =
              "#16803c";

            saveButton.textContent =
              "Saved";

            window.setTimeout(() => {
              const currentButton =
                doc.querySelector(
                  "#skytech-save-quote"
                );

              if (
                currentButton
              ) {
                currentButton.textContent =
                  "Save Changes";
              }
            }, 1500);
          } catch (error) {
            console.error(
              "Quote update error:",
              error
            );

            message.textContent =
              error.message ||
              "Failed to update quotation.";

            message.style.color =
              "#c62828";

            saveButton.textContent =
              "Save Changes";
          } finally {
            const currentButton =
              doc.querySelector(
                "#skytech-save-quote"
              );

            if (
              currentButton
            ) {
              currentButton.disabled =
                false;
            }
          }
        }
      );
    };

    // =========================================================
    // FETCH QUOTE
    // =========================================================

    const fetchQuote = async (
      doc
    ) => {
      try {
        const response =
          await apiFetch(
            `/api/admin/quotes/${quoteId}`
          );

        if (!response.ok) {
          throw new Error(
            `Quote API failed: ${response.status}`
          );
        }

        const quote =
          await response.json();

        console.log(
          "Quote Detail API:",
          quote
        );

        renderQuote(
          doc,
          quote
        );

        setupSaveButton(
          doc
        );
      } catch (error) {
        console.error(
          "Quote Detail Error:",
          error
        );
      }
    };

    // =========================================================
    // IFRAME LOAD
    // =========================================================

    const handleLoad = () => {
      timeoutId = window.setTimeout(() => {
        const doc =
          iframe.contentDocument;

        if (!doc) return;

        fetchQuote(doc);
      }, 300);
    };

    iframe.addEventListener(
      "load",
      handleLoad
    );

    if (
      iframe.contentDocument
        ?.readyState ===
      "complete"
    ) {
      handleLoad();
    }

    // =========================================================
    // CLEANUP
    // =========================================================

    return () => {
      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <iframe
        ref={iframeRef}
        title="SKYTECH Edit Quotation"
        src="/stitch/edit_quotation_skytech_admin/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}