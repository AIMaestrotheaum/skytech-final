import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function LeadManagement() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return;

    let timeoutId = null;

    let searchHandler = null;
    let searchInput = null;

    let statusHandler = null;
    let statusSelect = null;

    let industryHandler = null;
    let industrySelect = null;

    let previousButton = null;
    let nextButton = null;

    let previousHandler = null;
    let nextHandler = null;

    let currentSearch = "";
    let currentStatus = "";
    let currentIndustry = "";
    let currentPage = 1;

    // =========================================================
    // API ERROR MESSAGE
    // =========================================================

    const getApiErrorMessage = async (response) => {
      try {
        const data = await response.json();

        if (Array.isArray(data?.detail)) {
          return data.detail
            .map((item) => {
              const location = Array.isArray(item?.loc)
                ? item.loc.filter(Boolean).join(".")
                : "field";

              return `${location}: ${
                item?.msg || "Invalid value"
              }`;
            })
            .join("\n");
        }

        if (typeof data?.detail === "string") {
          return data.detail;
        }

        if (
          data?.detail &&
          typeof data.detail === "object"
        ) {
          return (
            data.detail.msg ||
            JSON.stringify(data.detail, null, 2)
          );
        }

        if (data?.message) {
          return data.message;
        }
      } catch {
        // Ignore JSON parsing errors
      }

      return `Request failed with status ${response.status}`;
    };

    // =========================================================
    // RENDER LEADS
    // =========================================================

    const renderLeads = (doc, data) => {
      const main =
        doc.querySelector("main") || doc.body;

      const table = main.querySelector("table");

      if (table) {
        const tbody = table.querySelector("tbody");

        if (tbody) {
          tbody.innerHTML = "";

          const leads = Array.isArray(data?.leads)
            ? data.leads
            : [];

          leads.forEach((lead) => {
            const row = doc.createElement("tr");

            row.innerHTML = `
              <td>
                <a
                  href="#"
                  data-lead-id="${lead.id}"
                  class="lead-detail-link"
                  style="
                    color:#0050cc;
                    font-weight:600;
                    text-decoration:none;
                    cursor:pointer;
                  "
                >
                  ${lead.lead_code || "-"}
                </a>
              </td>

              <td>
                ${lead.customer_name || "-"}
              </td>

              <td>
                ${lead.company || "-"}
              </td>

              <td>
                ${lead.industry || "-"}
              </td>

              <td>
                ${lead.requirement || "-"}
              </td>

              <td>
                ${lead.status || "-"}
              </td>

              <td>
                ${lead.assigned_to || "-"}
              </td>

              <td>
                ${
                  lead.created_at
                    ? new Date(
                        lead.created_at
                      ).toLocaleDateString("en-IN")
                    : "-"
                }
              </td>
            `;

            tbody.appendChild(row);

            // -------------------------------------------------
            // LEAD DETAIL NAVIGATION
            // -------------------------------------------------

            const leadLink =
              row.querySelector(
                ".lead-detail-link"
              );

            if (leadLink) {
              leadLink.addEventListener(
                "click",
                (event) => {
                  event.preventDefault();

                  const leadId =
                    leadLink.getAttribute(
                      "data-lead-id"
                    );

                  if (leadId) {
                    sessionStorage.setItem(
                      "selected_lead_id",
                      leadId
                    );

                    window.parent.location.href =
                      "/admin/leads/detail";
                  }
                }
              );
            }
          });
        }
      }

      // =======================================================
      // PAGINATION TEXT
      // =======================================================

      const paginationText = Array.from(
        main.querySelectorAll("*")
      ).find(
        (element) =>
          element.children.length === 0 &&
          /showing.*of/i.test(
            element.textContent?.trim() || ""
          )
      );

      if (paginationText) {
        const total = Number(data?.total || 0);
        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || 10);

        const leads = Array.isArray(data?.leads)
          ? data.leads
          : [];

        const start =
          total === 0
            ? 0
            : (page - 1) * limit + 1;

        const end =
          total === 0
            ? 0
            : (page - 1) * limit +
              leads.length;

        paginationText.textContent =
          `Showing ${start}-${end} of ${total} leads`;
      }

      // =======================================================
      // PREVIOUS BUTTON
      // =======================================================

      if (previousButton) {
        const isFirstPage =
          Number(data?.page || 1) <= 1;

        previousButton.disabled = isFirstPage;

        previousButton.style.opacity =
          isFirstPage ? "0.5" : "1";

        previousButton.style.pointerEvents =
          isFirstPage ? "none" : "auto";
      }

      // =======================================================
      // NEXT BUTTON
      // =======================================================

      if (nextButton) {
        const page =
          Number(data?.page || 1);

        const totalPages =
          Number(data?.total_pages || 1);

        const isLastPage =
          page >= totalPages;

        nextButton.disabled =
          isLastPage;

        nextButton.style.opacity =
          isLastPage ? "0.5" : "1";

        nextButton.style.pointerEvents =
          isLastPage ? "none" : "auto";
      }

      console.log(
        `Lead page ${data?.page || 1} of ${
          data?.total_pages || 1
        }`
      );
    };

    // =========================================================
    // FETCH LEADS
    // =========================================================

    const fetchLeads = async (doc) => {
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

        if (currentIndustry.trim()) {
          params.set(
            "industry",
            currentIndustry.trim()
          );
        }

        params.set(
          "page",
          String(currentPage)
        );

        params.set("limit", "10");

        const queryString =
          params.toString();

        const endpoint =
          `/api/admin/leads?${queryString}`;

        const response =
          await apiFetch(endpoint);

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response
            )
          );
        }

        const data =
          await response.json();

        console.log(
          "Lead Management API:",
          data
        );

        renderLeads(doc, data);
      } catch (error) {
        console.error(
          "Lead Management Error:",
          error
        );
      }
    };

    // =========================================================
    // FIND PAGINATION BUTTON
    // =========================================================

    let mainElement = null;

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
              .getAttribute("aria-label")
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

    // =========================================================
    // SETUP PAGE
    // =========================================================

    const setupPage = () => {
      const doc =
        iframe.contentDocument;

      if (!doc) return;

      mainElement =
        doc.querySelector("main") ||
        doc.body;

      // -------------------------------------------------------
      // INITIAL LOAD
      // -------------------------------------------------------

      currentPage = 1;

      fetchLeads(doc);

      // -------------------------------------------------------
      // SEARCH
      // -------------------------------------------------------

      const inputs = Array.from(
        doc.querySelectorAll("input")
      );

      searchInput =
        inputs.find((input) => {
          const placeholder =
            input
              .getAttribute("placeholder")
              ?.toLowerCase() || "";

          const ariaLabel =
            input
              .getAttribute("aria-label")
              ?.toLowerCase() || "";

          return (
            placeholder.includes("search") ||
            ariaLabel.includes("search")
          );
        }) || null;

      if (searchInput) {
        console.log(
          "Lead search connected"
        );

        searchHandler = () => {
          currentSearch =
            searchInput.value || "";

          currentPage = 1;

          fetchLeads(doc);
        };

        searchInput.addEventListener(
          "input",
          searchHandler
        );
      }

      // -------------------------------------------------------
      // STATUS + INDUSTRY
      // -------------------------------------------------------

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
            .getAttribute("aria-label")
            ?.toLowerCase() || "";

        const combined =
          `${text} ${ariaLabel}`;

        // -----------------------------------------------------
        // STATUS
        // -----------------------------------------------------

        if (
          !statusSelect &&
          combined.includes("status")
        ) {
          statusSelect = select;

          console.log(
            "Lead status filter connected"
          );

          statusHandler = () => {
            currentStatus =
              statusSelect.value || "";

            currentPage = 1;

            fetchLeads(doc);
          };

          statusSelect.addEventListener(
            "change",
            statusHandler
          );
        }

        // -----------------------------------------------------
        // INDUSTRY
        // -----------------------------------------------------

        if (
          !industrySelect &&
          combined.includes("industry")
        ) {
          industrySelect = select;

          console.log(
            "Lead industry filter connected"
          );

          industryHandler = () => {
            currentIndustry =
              industrySelect.value || "";

            currentPage = 1;

            fetchLeads(doc);
          };

          industrySelect.addEventListener(
            "change",
            industryHandler
          );
        }
      });

      // -------------------------------------------------------
      // PAGINATION
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // PREVIOUS
      // -------------------------------------------------------

      if (previousButton) {
        previousHandler = (event) => {
          event.preventDefault();

          if (currentPage > 1) {
            currentPage -= 1;

            fetchLeads(doc);
          }
        };

        previousButton.addEventListener(
          "click",
          previousHandler
        );
      }

      // -------------------------------------------------------
      // NEXT
      // -------------------------------------------------------

      if (nextButton) {
        nextHandler = (event) => {
          event.preventDefault();

          currentPage += 1;

          fetchLeads(doc);
        };

        nextButton.addEventListener(
          "click",
          nextHandler
        );
      }

      console.log(
        "Lead pagination connected:",
        {
          previousButton,
          nextButton,
        }
      );
    };

    // =========================================================
    // IFRAME LOAD
    // =========================================================

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
        industrySelect &&
        industryHandler
      ) {
        industrySelect.removeEventListener(
          "change",
          industryHandler
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
        title="SKYTECH Lead Management"
        src="/stitch/lead_management_skytech_admin/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}