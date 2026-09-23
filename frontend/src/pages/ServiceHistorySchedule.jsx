import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function ServiceHistorySchedule() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return undefined;
    }

    let timeoutId = null;
    let iframeDocument = null;

    /*
     * ==========================================================
     * API ERROR HELPER
     * ==========================================================
     */

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
        // Ignore JSON parsing errors.
      }

      return `Request failed with status ${response.status}`;
    };

    /*
     * ==========================================================
     * TEXT REPLACEMENT
     * ==========================================================
     */

    const replaceText = (
      container,
      possibleTexts,
      value
    ) => {
      if (!container) {
        return false;
      }

      const elements = Array.from(
        container.querySelectorAll("*")
      );

      const element = elements.find((el) => {
        if (el.children.length !== 0) {
          return false;
        }

        const text =
          el.textContent?.trim();

        return possibleTexts.includes(text);
      });

      if (element) {
        element.textContent =
          value ?? "-";

        return true;
      }

      return false;
    };

    /*
     * ==========================================================
     * SERVICE REQUEST DETAIL
     * ==========================================================
     */

    const renderServiceRequestDetail = (
      doc,
      data
    ) => {
      const main =
        doc.querySelector("main") ||
        doc.body;

      const request =
        data?.service_request ||
        data ||
        {};

      replaceText(
        main,
        [
          "SR-501",
          "SR-001",
          "Request ID",
          "Service Request",
        ],
        request.request_code
      );

      replaceText(
        main,
        [
          "Transformer Failure",
          "Issue",
        ],
        request.issue
      );

      replaceText(
        main,
        [
          "Critical",
          "critical",
          "Priority",
        ],
        request.priority
      );

      replaceText(
        main,
        [
          "Open",
          "open",
          "Status",
        ],
        request.status
      );

      replaceText(
        main,
        [
          "Assigned To",
          "Technician",
        ],
        request.assigned_to
      );

      replaceText(
        main,
        [
          "Customer",
          "Customer Name",
        ],
        request.customer_name
      );

      replaceText(
        main,
        [
          "Equipment",
          "Equipment Name",
        ],
        request.equipment_name
      );

      const createdDate =
        request.created_at
          ? new Date(
              request.created_at
            ).toLocaleDateString(
              "en-IN"
            )
          : "-";

      replaceText(
        main,
        [
          "Date",
          "Created Date",
          "Request Date",
        ],
        createdDate
      );
    };

    const fetchServiceRequestDetail = async (
      requestId,
      doc
    ) => {
      if (!requestId) {
        return;
      }

      try {
        const response = await apiFetch(
          `/api/customer/service-history/${requestId}`
        );

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response
            )
          );
        }

        const data =
          await response.json();

        renderServiceRequestDetail(
          doc,
          data
        );
      } catch (error) {
        console.error(
          "Service Request Detail Error:",
          error
        );
      }
    };

    /*
     * ==========================================================
     * EQUIPMENT
     * ==========================================================
     */

    const fetchEquipment = async () => {
      const response = await apiFetch(
        "/api/customer/equipment"
      );

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response
          )
        );
      }

      const data =
        await response.json();

      return Array.isArray(data)
        ? data
        : data?.equipment || [];
    };

    /*
     * ==========================================================
     * CREATE SERVICE REQUEST
     * ==========================================================
     */

    const createServiceRequest = async (
      payload
    ) => {
      const response = await apiFetch(
        "/api/customer/service-requests",
        {
          method: "POST",
          body: payload,
        }
      );

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response
          )
        );
      }

      return response.json();
    };

    /*
     * ==========================================================
     * SERVICE REQUEST MODAL
     * ==========================================================
     */

    const openServiceRequestModal = async (
      doc,
      refreshHistory
    ) => {
      const existingModal =
        doc.getElementById(
          "skytech-service-request-modal"
        );

      if (existingModal) {
        existingModal.remove();
      }

      let equipment = [];

      try {
        equipment =
          await fetchEquipment();
      } catch (error) {
        alert(
          `Unable to load equipment.\n\n${error.message}`
        );
        return;
      }

      const overlay =
        doc.createElement("div");

      overlay.id =
        "skytech-service-request-modal";

      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0,0,0,0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: Inter, Arial, sans-serif;
      `;

      const modal =
        doc.createElement("div");

      modal.style.cssText = `
        width: min(560px, 100%);
        max-height: 90vh;
        overflow-y: auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 28px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        box-sizing: border-box;
      `;

      const equipmentOptions =
        equipment.length > 0
          ? equipment
              .map(
                (item) => `
                  <option value="${item.id}">
                    ${
                      item.equipment_code ||
                      item.equipment_name ||
                      `Equipment ${item.id}`
                    }
                    ${
                      item.model
                        ? ` - ${item.model}`
                        : ""
                    }
                  </option>
                `
              )
              .join("")
          : `
              <option value="">
                No equipment available
              </option>
            `;

      modal.innerHTML = `
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            margin-bottom:20px;
          "
        >
          <div>
            <div
              style="
                font-size:12px;
                letter-spacing:2px;
                font-weight:700;
                color:#0050cc;
                margin-bottom:6px;
              "
            >
              SERVICE SUPPORT
            </div>

            <h2
              style="
                margin:0;
                font-size:26px;
                line-height:1.2;
                color:#111111;
              "
            >
              Request Service
            </h2>
          </div>

          <button
            type="button"
            id="skytech-close-service-request"
            style="
              width:40px;
              height:40px;
              border:0;
              border-radius:50%;
              background:#f2f4f6;
              cursor:pointer;
              font-size:22px;
              color:#222222;
            "
          >
            ×
          </button>
        </div>

        <p
          style="
            margin:0 0 24px 0;
            color:#555b64;
            font-size:14px;
            line-height:1.6;
          "
        >
          Submit a service request for your
          registered SKYTECH equipment.
        </p>

        <form id="skytech-service-request-form">

          <label
            style="
              display:block;
              font-size:13px;
              font-weight:700;
              margin-bottom:8px;
              color:#222222;
            "
          >
            Equipment
          </label>

          <select
            id="skytech-equipment"
            required
            style="
              width:100%;
              height:48px;
              padding:0 14px;
              margin-bottom:20px;
              border:1px solid #c5c6cd;
              border-radius:6px;
              background:#ffffff;
              font-size:15px;
              box-sizing:border-box;
            "
            ${
              equipment.length === 0
                ? "disabled"
                : ""
            }
          >
            <option value="">
              Select equipment
            </option>

            ${equipmentOptions}
          </select>

          <label
            style="
              display:block;
              font-size:13px;
              font-weight:700;
              margin-bottom:8px;
              color:#222222;
            "
          >
            Issue
          </label>

          <textarea
            id="skytech-service-issue"
            rows="5"
            required
            placeholder="Describe the problem with your equipment..."
            style="
              width:100%;
              box-sizing:border-box;
              padding:14px;
              margin-bottom:20px;
              border:1px solid #c5c6cd;
              border-radius:6px;
              resize:vertical;
              font-family:Inter, Arial, sans-serif;
              font-size:15px;
            "
          ></textarea>

          <label
            style="
              display:block;
              font-size:13px;
              font-weight:700;
              margin-bottom:8px;
              color:#222222;
            "
          >
            Priority
          </label>

          <select
            id="skytech-service-priority"
            style="
              width:100%;
              height:48px;
              padding:0 14px;
              margin-bottom:24px;
              border:1px solid #c5c6cd;
              border-radius:6px;
              background:#ffffff;
              font-size:15px;
              box-sizing:border-box;
            "
          >
            <option value="normal">
              Normal
            </option>

            <option value="high">
              High
            </option>

            <option value="critical">
              Critical
            </option>
          </select>

          <button
            type="submit"
            id="skytech-submit-service-request"
            style="
              width:100%;
              min-height:50px;
              border:0;
              border-radius:6px;
              background:#0050cc;
              color:#ffffff;
              font-size:15px;
              font-weight:700;
              cursor:pointer;
            "
          >
            Submit Service Request
          </button>

        </form>
      `;

      overlay.appendChild(modal);

      (
        doc.body ||
        doc.documentElement
      ).appendChild(overlay);

      const closeModal = () => {
        overlay.remove();
      };

      modal
        .querySelector(
          "#skytech-close-service-request"
        )
        ?.addEventListener(
          "click",
          closeModal
        );

      overlay.addEventListener(
        "click",
        (event) => {
          if (
            event.target === overlay
          ) {
            closeModal();
          }
        }
      );

      const serviceForm =
        modal.querySelector(
          "#skytech-service-request-form"
        );

      serviceForm?.addEventListener(
        "submit",
        async (event) => {
          event.preventDefault();

          const equipmentId =
            modal.querySelector(
              "#skytech-equipment"
            )?.value;

          const issue =
            modal
              .querySelector(
                "#skytech-service-issue"
              )
              ?.value?.trim() || "";

          const priority =
            modal.querySelector(
              "#skytech-service-priority"
            )?.value || "normal";

          if (!equipmentId) {
            alert(
              "Please select your equipment."
            );
            return;
          }

          if (!issue) {
            alert(
              "Please describe the issue."
            );
            return;
          }

          const submitButton =
            modal.querySelector(
              "#skytech-submit-service-request"
            );

          const originalText =
            submitButton?.textContent;

          if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
              "Submitting...";
          }

          try {
            const data =
              await createServiceRequest({
                equipment_id:
                  Number(equipmentId),
                issue,
                priority,
              });

            const requestCode =
              data?.request_code ||
              data?.service_request
                ?.request_code ||
              data?.request
                ?.request_code ||
              "Generated";

            const requestId =
              data?.id ||
              data?.request_id ||
              data?.service_request_id ||
              data?.service_request?.id ||
              data?.request?.id;

            if (requestId) {
              sessionStorage.setItem(
                "selected_service_request_id",
                String(requestId)
              );
            }

            alert(
              `Service request submitted successfully!\n\nRequest Code: ${requestCode}`
            );

            closeModal();

            await refreshHistory();
          } catch (error) {
            console.error(
              "Service Request Error:",
              error
            );

            alert(
              `Unable to submit service request.\n\n${error.message}`
            );
          } finally {
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent =
                originalText ||
                "Submit Service Request";
            }
          }
        }
      );
    };

    /*
     * ==========================================================
     * REQUEST BUTTON
     * ==========================================================
     */

    const setupRequestButton = (
      doc,
      refreshHistory
    ) => {
      const main =
        doc.querySelector("main") ||
        doc.body;

      const buttons = Array.from(
        main.querySelectorAll(
          "button, a, [role='button']"
        )
      );

      const existingButton =
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

          return (
            combined.includes(
              "request service"
            ) ||
            combined.includes(
              "schedule service"
            ) ||
            combined.includes(
              "new service"
            ) ||
            combined.includes(
              "raise request"
            )
          );
        });

      if (existingButton) {
        existingButton.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            openServiceRequestModal(
              doc,
              refreshHistory
            );
          }
        );

        return;
      }

      /*
       * Fallback button if Stitch screen
       * does not contain one.
       */

      const table =
        main.querySelector("table");

      if (!table) {
        return;
      }

      if (
        main.querySelector(
          "#skytech-open-service-request"
        )
      ) {
        return;
      }

      const wrapper =
        doc.createElement("div");

      wrapper.style.cssText = `
        display:flex;
        justify-content:flex-end;
        margin:0 0 20px 0;
      `;

      const button =
        doc.createElement("button");

      button.id =
        "skytech-open-service-request";

      button.type = "button";

      button.textContent =
        "Request Service";

      button.style.cssText = `
        border:0;
        border-radius:6px;
        background:#0050cc;
        color:#ffffff;
        padding:12px 22px;
        font-size:14px;
        font-weight:700;
        cursor:pointer;
      `;

      button.addEventListener(
        "click",
        () => {
          openServiceRequestModal(
            doc,
            refreshHistory
          );
        }
      );

      wrapper.appendChild(button);

      table.parentElement?.insertBefore(
        wrapper,
        table
      );
    };

    /*
     * ==========================================================
     * RENDER SERVICE HISTORY
     * ==========================================================
     */

    const renderServiceHistory = (
      doc,
      data
    ) => {
      const main =
        doc.querySelector("main") ||
        doc.body;

      const table =
        main.querySelector("table");

      const serviceHistory =
        data?.service_history || [];

      if (table) {
        const tbody =
          table.querySelector("tbody");

        if (tbody) {
          tbody.innerHTML = "";

          serviceHistory.forEach(
            (request) => {
              const row =
                doc.createElement("tr");

              row.innerHTML = `
                <td>
                  <a
                    href="#"
                    class="service-request-link"
                    data-request-id="${request.id}"
                    style="
                      color:#0050cc;
                      font-weight:600;
                      text-decoration:none;
                      cursor:pointer;
                    "
                  >
                    ${
                      request.request_code ||
                      "-"
                    }
                  </a>
                </td>

                <td>
                  ${
                    request.issue || "-"
                  }
                </td>

                <td>
                  ${
                    request.equipment_name ||
                    "-"
                  }
                </td>

                <td>
                  ${
                    request.priority || "-"
                  }
                </td>

                <td>
                  ${
                    request.status || "-"
                  }
                </td>

                <td>
                  ${
                    request.assigned_to ||
                    "-"
                  }
                </td>

                <td>
                  ${
                    request.created_at
                      ? new Date(
                          request.created_at
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "-"
                  }
                </td>
              `;

              tbody.appendChild(row);

              const requestLink =
                row.querySelector(
                  ".service-request-link"
                );

              requestLink?.addEventListener(
                "click",
                (event) => {
                  event.preventDefault();

                  const requestId =
                    requestLink.getAttribute(
                      "data-request-id"
                    );

                  if (!requestId) {
                    return;
                  }

                  sessionStorage.setItem(
                    "selected_service_request_id",
                    requestId
                  );

                  fetchServiceRequestDetail(
                    requestId,
                    doc
                  );
                }
              );
            }
          );
        }
      }

      /*
       * Pagination text.
       */

      const paginationText =
        Array.from(
          main.querySelectorAll("*")
        ).find(
          (element) =>
            element.children.length === 0 &&
            /showing.*of/i.test(
              element.textContent?.trim() ||
                ""
            )
        );

      if (paginationText) {
        const page =
          data?.page || 1;

        const limit =
          data?.limit ||
          serviceHistory.length ||
          1;

        const total =
          data?.total ??
          serviceHistory.length;

        const start =
          total === 0
            ? 0
            : (page - 1) * limit + 1;

        const end =
          total === 0
            ? 0
            : (page - 1) * limit +
              serviceHistory.length;

        paginationText.textContent =
          `Showing ${start}-${end} of ${total} service requests`;
      }
    };

    /*
     * ==========================================================
     * FETCH SERVICE HISTORY
     * ==========================================================
     */

    const fetchServiceHistory = async (
      doc
    ) => {
      try {
        const response = await apiFetch(
          "/api/customer/service-history"
        );

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response
            )
          );
        }

        const data =
          await response.json();

        renderServiceHistory(
          doc,
          data
        );

        setupRequestButton(
          doc,
          async () => {
            await fetchServiceHistory(
              doc
            );
          }
        );
      } catch (error) {
        console.error(
          "Customer Service History Error:",
          error
        );
      }
    };

    /*
     * ==========================================================
     * IFRAME LOAD
     * ==========================================================
     */

    const handleLoad = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(
        () => {
          const doc =
            iframe.contentDocument;

          if (!doc) {
            console.error(
              "Unable to access Stitch iframe document."
            );
            return;
          }

          iframeDocument = doc;

          fetchServiceHistory(doc);

          const savedRequestId =
            sessionStorage.getItem(
              "selected_service_request_id"
            );

          if (savedRequestId) {
            fetchServiceRequestDetail(
              savedRequestId,
              doc
            );
          }
        },
        300
      );
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

    /*
     * ==========================================================
     * CLEANUP
     * ==========================================================
     */

    return () => {
      iframe.removeEventListener(
        "load",
        handleLoad
      );

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      iframeDocument = null;
    };
  }, []);

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <iframe
        ref={iframeRef}
        title="SKYTECH Customer Service History"
        src="/stitch/service_history_schedule_skytech_portal/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}