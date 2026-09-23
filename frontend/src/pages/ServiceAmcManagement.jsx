import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function ServiceAmcManagement() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return;

    let timeoutId = null;

    let searchInput = null;
    let searchHandler = null;

    let statusSelect = null;
    let statusHandler = null;

    let previousButton = null;
    let nextButton = null;

    let previousHandler = null;
    let nextHandler = null;

    let mainElement = null;

    let currentSearch = "";
    let currentStatus = "";
    let currentPage = 1;

    // =========================================================
    // SELECTED AMC
    // =========================================================

    const getSelectedAmcId = () => {
      return sessionStorage.getItem("selected_amc_id");
    };

    // =========================================================
    // FIND ELEMENT
    // =========================================================

    const findElement = (
      doc,
      keywords,
      selectors = []
    ) => {
      for (const selector of selectors) {
        const element = doc.querySelector(selector);

        if (element) {
          return element;
        }
      }

      const elements = Array.from(
        doc.querySelectorAll(
          "input, textarea, select, button, a, p, span, div"
        )
      );

      return (
        elements.find((element) => {
          const text =
            element.textContent
              ?.trim()
              .toLowerCase() || "";

          const placeholder =
            element
              .getAttribute("placeholder")
              ?.toLowerCase() || "";

          const aria =
            element
              .getAttribute("aria-label")
              ?.toLowerCase() || "";

          const title =
            element
              .getAttribute("title")
              ?.toLowerCase() || "";

          const combined =
            `${text} ${placeholder} ${aria} ${title}`;

          return keywords.some((keyword) =>
            combined.includes(
              keyword.toLowerCase()
            )
          );
        }) || null
      );
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {
      if (!date) return "-";

      const parsed = new Date(date);

      if (Number.isNaN(parsed.getTime())) {
        return date;
      }

      return parsed.toLocaleDateString("en-IN");
    };

    // =========================================================
    // FORMAT AMOUNT
    // =========================================================

    const formatAmount = (amount) => {
      if (
        amount === null ||
        amount === undefined ||
        amount === ""
      ) {
        return "-";
      }

      const value = Number(amount);

      if (Number.isNaN(value)) {
        return "-";
      }

      return `₹${value.toLocaleString("en-IN")}`;
    };

    // =========================================================
    // FETCH AMC DETAIL
    // =========================================================

    const fetchAmcDetail = async (contractId) => {
      if (!contractId) {
        return null;
      }

      try {
        const response = await apiFetch(
          `/api/admin/service-amc/${contractId}`
        );

        if (!response.ok) {
          throw new Error(
            `AMC detail API failed: ${response.status}`
          );
        }

        const data = await response.json();

        console.log("AMC Detail:", data);

        return data.contract || data;
      } catch (error) {
        console.error(
          "AMC Detail Error:",
          error
        );

        return null;
      }
    };

    // =========================================================
    // UPDATE AMC
    // =========================================================

    const updateAmc = async (
      contractId,
      payload
    ) => {
      if (!contractId) {
        throw new Error("AMC ID is missing.");
      }

      const response = await apiFetch(
        `/api/admin/service-amc/${contractId}`,
        {
          method: "PUT",
          body: payload,
        }
      );

      if (!response.ok) {
        let errorMessage =
          `AMC update failed: ${response.status}`;

        try {
          const errorData =
            await response.json();

          if (
            typeof errorData?.detail ===
            "string"
          ) {
            errorMessage =
              errorData.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    };

    // =========================================================
    // INJECT AMC DETAIL
    // =========================================================

    const injectAmcDetail = (
      doc,
      contract
    ) => {
      if (!contract) return;

      console.log(
        "Injecting AMC detail:",
        contract
      );

      const replaceText = (
        keywords,
        value
      ) => {
        const element = findElement(
          doc,
          keywords
        );

        if (!element) return;

        if (
          element.tagName === "INPUT" ||
          element.tagName === "TEXTAREA"
        ) {
          element.value = value ?? "";
        } else if (
          element.tagName === "SELECT"
        ) {
          element.value = value ?? "";
        } else {
          element.textContent = value ?? "-";
        }
      };

      replaceText(
        [
          "contract code",
          "amc code",
          "contract id",
        ],
        contract.contract_code
      );

      replaceText(
        [
          "customer name",
          "customer",
        ],
        contract.customer_name
      );

      replaceText(
        ["company"],
        contract.company
      );

      replaceText(
        [
          "amount",
          "contract value",
          "amc value",
        ],
        formatAmount(contract.amount)
      );

      replaceText(
        ["status"],
        contract.status
      );

      replaceText(
        [
          "start date",
          "start",
        ],
        formatDate(contract.start_date)
      );

      replaceText(
        [
          "end date",
          "expiry",
          "expiry date",
        ],
        formatDate(contract.end_date)
      );

      sessionStorage.setItem(
        "selected_amc_detail",
        JSON.stringify(contract)
      );

      window.dispatchEvent(
        new CustomEvent(
          "skytech-amc-selected",
          {
            detail: contract,
          }
        )
      );
    };

    // =========================================================
    // CREATE AMC EDIT PANEL
    // =========================================================

    const createEditPanel = (
      doc,
      contract
    ) => {
      const existing =
        doc.querySelector(
          "#skytech-amc-edit-panel"
        );

      if (existing) {
        existing.remove();
      }

      const main =
        doc.querySelector("main") ||
        doc.body;

      const panel =
        doc.createElement("div");

      panel.id =
        "skytech-amc-edit-panel";

      panel.style.cssText = `
        margin:24px 0;
        padding:24px;
        border:1px solid #d9dde5;
        border-radius:12px;
        background:#ffffff;
        box-shadow:0 4px 16px rgba(0,0,0,0.06);
        font-family:Inter,Arial,sans-serif;
      `;

      panel.innerHTML = `
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            margin-bottom:20px;
            flex-wrap:wrap;
          "
        >
          <div>
            <h2
              style="
                margin:0;
                font-size:20px;
                font-weight:700;
                color:#0d1c32;
              "
            >
              Update AMC Contract
            </h2>

            <p
              style="
                margin:6px 0 0;
                color:#666;
                font-size:14px;
              "
            >
              Update AMC status, amount and contract dates.
            </p>
          </div>

          <span
            style="
              padding:6px 10px;
              border-radius:6px;
              background:#f2f4f6;
              font-size:13px;
              font-weight:600;
            "
          >
            ${contract.contract_code || "-"}
          </span>
        </div>

        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(auto-fit,minmax(210px,1fr));
            gap:18px;
          "
        >
          <div>
            <label
              style="
                display:block;
                margin-bottom:7px;
                font-size:13px;
                font-weight:600;
              "
            >
              Status
            </label>

            <select
              id="skytech-amc-status"
              style="
                width:100%;
                box-sizing:border-box;
                padding:11px 12px;
                border:1px solid #c5c6cd;
                border-radius:7px;
                background:#fff;
              "
            >
              <option value="active">
                Active
              </option>

              <option value="expired">
                Expired
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          <div>
            <label
              style="
                display:block;
                margin-bottom:7px;
                font-size:13px;
                font-weight:600;
              "
            >
              Amount
            </label>

            <input
              id="skytech-amc-amount"
              type="number"
              min="0"
              step="0.01"
              value="${contract.amount ?? ""}"
              placeholder="AMC amount"
              style="
                width:100%;
                box-sizing:border-box;
                padding:11px 12px;
                border:1px solid #c5c6cd;
                border-radius:7px;
              "
            />
          </div>

          <div>
            <label
              style="
                display:block;
                margin-bottom:7px;
                font-size:13px;
                font-weight:600;
              "
            >
              Start Date
            </label>

            <input
              id="skytech-amc-start-date"
              type="date"
              value="${contract.start_date || ""}"
              style="
                width:100%;
                box-sizing:border-box;
                padding:11px 12px;
                border:1px solid #c5c6cd;
                border-radius:7px;
              "
            />
          </div>

          <div>
            <label
              style="
                display:block;
                margin-bottom:7px;
                font-size:13px;
                font-weight:600;
              "
            >
              End Date
            </label>

            <input
              id="skytech-amc-end-date"
              type="date"
              value="${contract.end_date || ""}"
              style="
                width:100%;
                box-sizing:border-box;
                padding:11px 12px;
                border:1px solid #c5c6cd;
                border-radius:7px;
              "
            />
          </div>
        </div>

        <div
          style="
            display:flex;
            align-items:center;
            gap:12px;
            margin-top:22px;
          "
        >
          <button
            id="skytech-amc-save"
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

          <span
            id="skytech-amc-message"
            style="
              font-size:14px;
              font-weight:500;
            "
          ></span>
        </div>
      `;

      main.prepend(panel);

      const statusInput =
        doc.querySelector(
          "#skytech-amc-status"
        );

      if (statusInput) {
        const currentStatus =
          String(
            contract.status || ""
          ).toLowerCase();

        const option =
          Array.from(
            statusInput.options
          ).find(
            (item) =>
              item.value.toLowerCase() ===
              currentStatus
          );

        if (option) {
          statusInput.value =
            option.value;
        }
      }

      const saveButton =
        doc.querySelector(
          "#skytech-amc-save"
        );

      const message =
        doc.querySelector(
          "#skytech-amc-message"
        );

      if (!saveButton) return;

      saveButton.addEventListener(
        "click",
        async () => {
          try {
            const status =
              doc.querySelector(
                "#skytech-amc-status"
              )?.value || null;

            const amountRaw =
              doc.querySelector(
                "#skytech-amc-amount"
              )?.value;

            const startDate =
              doc.querySelector(
                "#skytech-amc-start-date"
              )?.value || null;

            const endDate =
              doc.querySelector(
                "#skytech-amc-end-date"
              )?.value || null;

            if (
              amountRaw === "" ||
              amountRaw === undefined
            ) {
              throw new Error(
                "Please enter the AMC amount."
              );
            }

            const amount =
              Number(amountRaw);

            if (
              Number.isNaN(amount) ||
              amount < 0
            ) {
              throw new Error(
                "AMC amount must be a valid non-negative number."
              );
            }

            if (
              startDate &&
              endDate &&
              endDate < startDate
            ) {
              throw new Error(
                "End date cannot be before start date."
              );
            }

            saveButton.disabled = true;
            saveButton.textContent =
              "Saving...";

            if (message) {
              message.textContent = "";
            }

            const updated =
              await updateAmc(
                contract.id,
                {
                  status,
                  amount,
                  start_date:
                    startDate,
                  end_date:
                    endDate,
                }
              );

            const updatedContract =
              updated.contract ||
              updated;

            injectAmcDetail(
              doc,
              updatedContract
            );

            createEditPanel(
              doc,
              updatedContract
            );

            const newMessage =
              doc.querySelector(
                "#skytech-amc-message"
              );

            if (newMessage) {
              newMessage.textContent =
                "AMC updated successfully.";

              newMessage.style.color =
                "#16803c";
            }

            console.log(
              "AMC updated successfully:",
              updatedContract
            );
          } catch (error) {
            console.error(
              "AMC update error:",
              error
            );

            const currentMessage =
              doc.querySelector(
                "#skytech-amc-message"
              );

            const currentSaveButton =
              doc.querySelector(
                "#skytech-amc-save"
              );

            if (currentMessage) {
              currentMessage.textContent =
                error.message ||
                "Failed to update AMC.";

              currentMessage.style.color =
                "#c62828";
            }

            if (currentSaveButton) {
              currentSaveButton.textContent =
                "Save Changes";

              currentSaveButton.disabled =
                false;
            }
          }
        }
      );
    };

    // =========================================================
    // RENDER AMC TABLE
    // =========================================================

    const renderContracts = (
      doc,
      data
    ) => {
      const main =
        doc.querySelector("main") ||
        doc.body;

      const table =
        main.querySelector("table");

      if (table) {
        const tbody =
          table.querySelector("tbody");

        if (tbody) {
          tbody.innerHTML = "";

          const contracts =
            Array.isArray(
              data.contracts
            )
              ? data.contracts
              : [];

          contracts.forEach(
            (contract) => {
              const row =
                doc.createElement("tr");

              row.innerHTML = `
                <td>
                  <a
                    href="#"
                    class="amc-detail-link"
                    data-contract-id="${contract.id}"
                    style="
                      color:#0050cc;
                      font-weight:600;
                      text-decoration:none;
                      cursor:pointer;
                    "
                  >
                    ${contract.contract_code || "-"}
                  </a>
                </td>

                <td>
                  ${contract.customer_name || "-"}
                </td>

                <td>
                  ${contract.company || "-"}
                </td>

                <td>
                  ${formatAmount(contract.amount)}
                </td>

                <td>
                  ${contract.status || "-"}
                </td>

                <td>
                  ${formatDate(contract.start_date)}
                </td>

                <td>
                  ${formatDate(contract.end_date)}
                </td>
              `;

              tbody.appendChild(row);

              const contractLink =
                row.querySelector(
                  ".amc-detail-link"
                );

              if (contractLink) {
                contractLink.addEventListener(
                  "click",
                  async (event) => {
                    event.preventDefault();

                    const contractId =
                      contractLink.getAttribute(
                        "data-contract-id"
                      );

                    if (!contractId) {
                      return;
                    }

                    sessionStorage.setItem(
                      "selected_amc_id",
                      contractId
                    );

                    console.log(
                      "Selected AMC:",
                      contractId
                    );

                    const detail =
                      await fetchAmcDetail(
                        contractId
                      );

                    if (detail) {
                      injectAmcDetail(
                        doc,
                        detail
                      );

                      createEditPanel(
                        doc,
                        detail
                      );
                    }
                  }
                );
              }
            }
          );
        }
      }

      // =======================================================
      // PAGINATION TEXT
      // =======================================================

      const paginationText =
        Array.from(
          main.querySelectorAll("*")
        ).find(
          (element) =>
            element.children.length === 0 &&
            /showing.*of/i.test(
              element.textContent.trim()
            )
        );

      if (paginationText) {
        const total =
          Number(data.total || 0);

        const page =
          Number(data.page || 1);

        const limit =
          Number(data.limit || 10);

        const contracts =
          Array.isArray(
            data.contracts
          )
            ? data.contracts
            : [];

        const start =
          total === 0
            ? 0
            : (page - 1) *
                limit +
              1;

        const end =
          total === 0
            ? 0
            : (page - 1) *
                limit +
              contracts.length;

        paginationText.textContent =
          `Showing ${start}-${end} of ${total} contracts`;
      }

      // =======================================================
      // PREVIOUS
      // =======================================================

      if (previousButton) {
        const disabled =
          Number(data.page || 1) <= 1;

        previousButton.disabled =
          disabled;

        previousButton.style.opacity =
          disabled ? "0.5" : "1";

        previousButton.style.pointerEvents =
          disabled
            ? "none"
            : "auto";
      }

      // =======================================================
      // NEXT
      // =======================================================

      if (nextButton) {
        const disabled =
          Number(data.page || 1) >=
          Number(
            data.total_pages || 1
          );

        nextButton.disabled =
          disabled;

        nextButton.style.opacity =
          disabled ? "0.5" : "1";

        nextButton.style.pointerEvents =
          disabled
            ? "none"
            : "auto";
      }

      console.log(
        `AMC Page ${data.page || 1} of ${
          data.total_pages || 1
        }`
      );
    };

    // =========================================================
    // FETCH AMC LIST
    // =========================================================

    const fetchContracts = async (
      doc
    ) => {
      try {
        const params =
          new URLSearchParams();

        if (
          currentSearch.trim()
        ) {
          params.set(
            "search",
            currentSearch.trim()
          );
        }

        if (
          currentStatus.trim()
        ) {
          params.set(
            "status",
            currentStatus.trim()
          );
        }

        params.set(
          "page",
          String(currentPage)
        );

        params.set(
          "limit",
          "10"
        );

        const endpoint =
          `/api/admin/service-amc?${params.toString()}`;

        const response =
          await apiFetch(endpoint);

        if (!response.ok) {
          throw new Error(
            `AMC API failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        console.log(
          "AMC Management API:",
          data
        );

        renderContracts(
          doc,
          data
        );
      } catch (error) {
        console.error(
          "AMC Management Error:",
          error
        );
      }
    };

    // =========================================================
    // FIND BUTTON
    // =========================================================

    const findButton = (
      keywords
    ) => {
      if (!mainElement) {
        return null;
      }

      const buttons =
        Array.from(
          mainElement.querySelectorAll(
            "button, a, [role='button']"
          )
        );

      return (
        buttons.find(
          (button) => {
            const text =
              button.textContent
                ?.trim()
                .toLowerCase() ||
              "";

            const aria =
              button
                .getAttribute(
                  "aria-label"
                )
                ?.toLowerCase() ||
              "";

            const title =
              button
                .getAttribute("title")
                ?.toLowerCase() ||
              "";

            const combined =
              `${text} ${aria} ${title}`;

            return keywords.some(
              (keyword) =>
                combined.includes(
                  keyword
                )
            );
          }
        ) || null
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

      currentPage = 1;

      // Initial AMC fetch
      fetchContracts(doc);

      // =======================================================
      // SEARCH
      // =======================================================

      const inputs =
        Array.from(
          doc.querySelectorAll("input")
        );

      searchInput =
        inputs.find(
          (input) => {
            const placeholder =
              input
                .getAttribute(
                  "placeholder"
                )
                ?.toLowerCase() ||
              "";

            const ariaLabel =
              input
                .getAttribute(
                  "aria-label"
                )
                ?.toLowerCase() ||
              "";

            return (
              placeholder.includes(
                "search"
              ) ||
              ariaLabel.includes(
                "search"
              )
            );
          }
        ) || null;

      if (searchInput) {
        console.log(
          "AMC search connected"
        );

        searchHandler = () => {
          currentSearch =
            searchInput.value || "";

          currentPage = 1;

          fetchContracts(doc);
        };

        searchInput.addEventListener(
          "input",
          searchHandler
        );
      }

      // =======================================================
      // STATUS FILTER
      // =======================================================

      const selects =
        Array.from(
          doc.querySelectorAll("select")
        );

      selects.forEach(
        (select) => {
          const text =
            select.parentElement
              ?.textContent
              ?.toLowerCase() ||
            "";

          const ariaLabel =
            select
              .getAttribute(
                "aria-label"
              )
              ?.toLowerCase() ||
            "";

          const combined =
            `${text} ${ariaLabel}`;

          if (
            !statusSelect &&
            combined.includes("status")
          ) {
            statusSelect = select;

            console.log(
              "AMC status filter connected"
            );

            statusHandler = () => {
              currentStatus =
                statusSelect.value || "";

              currentPage = 1;

              fetchContracts(doc);
            };

            statusSelect.addEventListener(
              "change",
              statusHandler
            );
          }
        }
      );

      // =======================================================
      // PAGINATION
      // =======================================================

      previousButton =
        findButton([
          "previous",
          "prev",
          "chevron_left",
          "arrow_back",
        ]);

      nextButton =
        findButton([
          "next",
          "chevron_right",
          "arrow_forward",
        ]);

      if (previousButton) {
        previousHandler =
          (event) => {
            event.preventDefault();

            if (
              currentPage > 1
            ) {
              currentPage -= 1;

              fetchContracts(doc);
            }
          };

        previousButton.addEventListener(
          "click",
          previousHandler
        );
      }

      if (nextButton) {
        nextHandler =
          (event) => {
            event.preventDefault();

            currentPage += 1;

            fetchContracts(doc);
          };

        nextButton.addEventListener(
          "click",
          nextHandler
        );
      }

      console.log(
        "AMC pagination connected:",
        {
          previousButton,
          nextButton,
        }
      );

      // =======================================================
      // RESTORE SELECTED AMC
      // =======================================================

      const selectedAmcId =
        getSelectedAmcId();

      if (selectedAmcId) {
        fetchAmcDetail(
          selectedAmcId
        ).then(
          (detail) => {
            if (detail) {
              injectAmcDetail(
                doc,
                detail
              );

              createEditPanel(
                doc,
                detail
              );
            }
          }
        );
      }
    };

    // =========================================================
    // IFRAME LOAD
    // =========================================================

    const handleLoad = () => {
      if (timeoutId !== null) {
        window.clearTimeout(
          timeoutId
        );
      }

      timeoutId =
        window.setTimeout(
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

    // =========================================================
    // CLEANUP
    // =========================================================

    return () => {
      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (timeoutId !== null) {
        window.clearTimeout(
          timeoutId
        );
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
        title="SKYTECH Service AMC Management"
        src="/stitch/service_amc_management_skytech_admin/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}