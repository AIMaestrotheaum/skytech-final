import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function QuoteManagement() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return;

    let iframeDocument = null;
    let searchInput = null;
    let searchHandler = null;
    let statusSelect = null;
    let statusHandler = null;
    let previousButton = null;
    let nextButton = null;
    let previousHandler = null;
    let nextHandler = null;
    let mainElement = null;
    let timeoutId = null;

    let currentSearch = "";
    let currentStatus = "";
    let currentPage = 1;

    const renderQuotes = (doc, data) => {
      const main = doc.querySelector("main") || doc.body;

      const table = main.querySelector("table");

      if (table) {
        const tbody = table.querySelector("tbody");

        if (tbody) {
          tbody.innerHTML = "";

          data.quotes.forEach((quote) => {
            const row = doc.createElement("tr");

            row.innerHTML = `
              <td>
                <a
                  href="#"
                  data-quote-id="${quote.id}"
                  class="quote-detail-link"
                  style="
                    color: #0050cc;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                  "
                >
                  ${quote.quote_code || "-"}
                </a>
              </td>

              <td>
                ${quote.customer_name || "-"}
              </td>

              <td>
                ${quote.company || "-"}
              </td>

              <td>
                ${
                  quote.amount !== null &&
                  quote.amount !== undefined
                    ? `₹${Number(
                        quote.amount
                      ).toLocaleString("en-IN")}`
                    : "-"
                }
              </td>

              <td>
                ${quote.status || "-"}
              </td>

              <td>
                ${
                  quote.created_at
                    ? new Date(
                        quote.created_at
                      ).toLocaleDateString("en-IN")
                    : "-"
                }
              </td>
            `;

            tbody.appendChild(row);

            const quoteLink = row.querySelector(
              ".quote-detail-link"
            );

            if (quoteLink) {
              quoteLink.addEventListener(
                "click",
                (event) => {
                  event.preventDefault();

                  const quoteId =
                    quoteLink.getAttribute(
                      "data-quote-id"
                    );

                  if (quoteId) {
                    sessionStorage.setItem(
                      "selected_quote_id",
                      quoteId
                    );

                    window.parent.location.href =
                      "/admin/quotes/edit";
                  }
                }
              );
            }
          });
        }
      }

      /*
       * Pagination text
       */
      const paginationText = Array.from(
        main.querySelectorAll("*")
      ).find(
        (element) =>
          element.children.length === 0 &&
          /showing.*of/i.test(
            element.textContent.trim()
          )
      );

      if (paginationText) {
        const start =
          data.total === 0
            ? 0
            : (data.page - 1) *
                data.limit +
              1;

        const end =
          (data.page - 1) *
            data.limit +
          data.quotes.length;

        paginationText.textContent =
          `Showing ${start}-${end} of ${data.total} quotes`;
      }

      /*
       * Previous button
       */
      if (previousButton) {
        previousButton.disabled =
          data.page <= 1;

        previousButton.style.opacity =
          data.page <= 1 ? "0.5" : "1";

        previousButton.style.pointerEvents =
          data.page <= 1
            ? "none"
            : "auto";
      }

      /*
       * Next button
       */
      if (nextButton) {
        nextButton.disabled =
          data.page >= data.total_pages;

        nextButton.style.opacity =
          data.page >= data.total_pages
            ? "0.5"
            : "1";

        nextButton.style.pointerEvents =
          data.page >= data.total_pages
            ? "none"
            : "auto";
      }

      console.log(
        `Quote Page ${data.page} of ${data.total_pages}`
      );
    };

    const fetchQuotes = async (doc) => {
      try {
        const params = new URLSearchParams();

        if (currentSearch.trim()) {
          params.set(
            "search",
            currentSearch.trim()
          );
        }

        if (currentStatus.trim()) {
          params.set(
            "status",
            currentStatus.trim()
          );
        }

        params.set(
          "page",
          currentPage
        );

        params.set(
          "limit",
          "10"
        );

        const queryString =
          params.toString();

        const endpoint =
          `/api/admin/quotes${
            queryString
              ? `?${queryString}`
              : ""
          }`;

        const response =
          await apiFetch(endpoint);

        if (!response.ok) {
          let message =
            `Quote API failed: ${response.status}`;

          try {
            const errorData =
              await response.json();

            if (
              typeof errorData?.detail ===
              "string"
            ) {
              message =
                errorData.detail;
            } else if (
              Array.isArray(
                errorData?.detail
              )
            ) {
              message =
                errorData.detail
                  .map(
                    (item) =>
                      item?.msg ||
                      "Validation error"
                  )
                  .join(", ");
            }
          } catch {
            // Keep the default status message.
          }

          throw new Error(message);
        }

        const data =
          await response.json();

        console.log(
          "Quote Management API:",
          data
        );

        renderQuotes(
          doc,
          data
        );
      } catch (error) {
        console.error(
          "Quote Management Error:",
          error
        );
      }
    };

    const findButton = (keywords) => {
      if (!mainElement) return null;

      const buttons = Array.from(
        mainElement.querySelectorAll(
          "button, a, [role='button']"
        )
      );

      return (
        buttons.find((button) => {
          const text =
            button.textContent
              ?.trim()
              .toLowerCase() || "";

          const aria =
            button
              .getAttribute(
                "aria-label"
              )
              ?.toLowerCase() || "";

          const title =
            button
              .getAttribute("title")
              ?.toLowerCase() || "";

          const combined =
            `${text} ${aria} ${title}`;

          return keywords.some(
            (keyword) =>
              combined.includes(keyword)
          );
        }) || null
      );
    };

    const setupPage = () => {
      const doc =
        iframe.contentDocument;

      if (!doc) return;

      iframeDocument = doc;

      mainElement =
        doc.querySelector("main") ||
        doc.body;

      /*
       * Initial load
       */
      currentPage = 1;

      fetchQuotes(doc);

      /*
       * SEARCH
       */
      const inputs = Array.from(
        doc.querySelectorAll("input")
      );

      searchInput =
        inputs.find((input) => {
          const placeholder =
            input
              .getAttribute(
                "placeholder"
              )
              ?.toLowerCase() || "";

          const ariaLabel =
            input
              .getAttribute(
                "aria-label"
              )
              ?.toLowerCase() || "";

          return (
            placeholder.includes(
              "search"
            ) ||
            ariaLabel.includes(
              "search"
            )
          );
        }) || null;

      if (searchInput) {
        console.log(
          "Quote search connected"
        );

        searchHandler = () => {
          currentSearch =
            searchInput.value;

          currentPage = 1;

          fetchQuotes(doc);
        };

        searchInput.addEventListener(
          "input",
          searchHandler
        );
      }

      /*
       * STATUS FILTER
       */
      const selects = Array.from(
        doc.querySelectorAll("select")
      );

      selects.forEach((select) => {
        const text =
          select.parentElement
            ?.textContent
            ?.toLowerCase() || "";

        const ariaLabel =
          select
            .getAttribute(
              "aria-label"
            )
            ?.toLowerCase() || "";

        const combined =
          `${text} ${ariaLabel}`;

        if (
          !statusSelect &&
          combined.includes("status")
        ) {
          statusSelect = select;

          console.log(
            "Quote status filter connected"
          );

          statusHandler = () => {
            currentStatus =
              statusSelect.value;

            currentPage = 1;

            fetchQuotes(doc);
          };

          statusSelect.addEventListener(
            "change",
            statusHandler
          );
        }
      });

      /*
       * PAGINATION
       */
      previousButton = findButton([
        "previous",
        "prev",
        "chevron_left",
        "arrow_back",
      ]);

      nextButton = findButton([
        "next",
        "chevron_right",
        "arrow_forward",
      ]);

      /*
       * Previous
       */
      if (previousButton) {
        previousHandler = (event) => {
          event.preventDefault();

          if (currentPage > 1) {
            currentPage -= 1;

            fetchQuotes(doc);
          }
        };

        previousButton.addEventListener(
          "click",
          previousHandler
        );
      }

      /*
       * Next
       */
      if (nextButton) {
        nextHandler = (event) => {
          event.preventDefault();

          currentPage += 1;

          fetchQuotes(doc);
        };

        nextButton.addEventListener(
          "click",
          nextHandler
        );
      }

      console.log(
        "Quote pagination connected:",
        {
          previousButton,
          nextButton,
        }
      );
    };

    const handleLoad = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(
        () => {
          setupPage();
        },
        300
      );
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

    return () => {
      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (
        searchInput &&
        searchHandler
      ) {
        searchInput.removeEventListener(
          "input",
          searchHandler
        );
      }

      if (
        statusSelect &&
        statusHandler
      ) {
        statusSelect.removeEventListener(
          "change",
          statusHandler
        );
      }

      if (
        previousButton &&
        previousHandler
      ) {
        previousButton.removeEventListener(
          "click",
          previousHandler
        );
      }

      if (
        nextButton &&
        nextHandler
      ) {
        nextButton.removeEventListener(
          "click",
          nextHandler
        );
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <iframe
        ref={iframeRef}
        title="SKYTECH Quote Management"
        src="/stitch/quote_management_skytech_admin/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}