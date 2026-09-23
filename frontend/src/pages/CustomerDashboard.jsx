import { useCallback, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";

import CustomerPortalShell from "../components/CustomerPortalShell";
import { apiFetch } from "../utils/api";
import { clearAuth } from "../utils/auth";

/*
|--------------------------------------------------------------------------
| Customer Dashboard
|--------------------------------------------------------------------------
| Original Stitch dashboard is preserved.
|
| React handles:
| - Dashboard API data
| - Customer name
| - Equipment count
| - AMC count
| - Service request count
| - Equipment data
| - AMC Status modal
| - Navigation through CustomerPortalShell
| - Logout
|--------------------------------------------------------------------------
*/

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function safeText(value, fallback = "-") {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}

function getAmcContracts(data) {
  if (!data) return [];

  if (Array.isArray(data.amc_contracts)) {
    return data.amc_contracts;
  }

  if (Array.isArray(data.amc)) {
    return data.amc;
  }

  if (Array.isArray(data.contracts)) {
    return data.contracts;
  }

  if (Array.isArray(data.amc_status)) {
    return data.amc_status;
  }

  if (data.amc && typeof data.amc === "object") {
    return [data.amc];
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| AMC Status Modal
|--------------------------------------------------------------------------
*/

function openAmcStatus(doc, navigate, dashboardData) {
  if (!doc?.body) return;

  const existingModal = doc.getElementById(
    "skytech-amc-status-modal"
  );

  if (existingModal) {
    existingModal.remove();
  }

  const existingStyle = doc.getElementById(
    "skytech-amc-responsive-style"
  );

  if (existingStyle) {
    existingStyle.remove();
  }

  const contracts = getAmcContracts(
    dashboardData
  );

  const activeAmc = Number(
    dashboardData?.active_amc ??
      dashboardData?.amc_count ??
      dashboardData?.active_amc_count ??
      contracts.filter(
        (item) =>
          normalize(
            item?.status ?? item?.amc_status
          ) === "active"
      ).length ??
      0
  );

  const overallStatus = safeText(
    dashboardData?.amc_status ??
      dashboardData?.status ??
      (activeAmc > 0
        ? "Active"
        : "No Active AMC")
  );

  const modal = doc.createElement("div");

  modal.id = "skytech-amc-status-modal";

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.62);
    backdrop-filter: blur(4px);
  `;

  const card = doc.createElement("div");

  card.style.cssText = `
    width: min(720px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 25px 70px rgba(0,0,0,.25);
    padding: 28px;
    font-family: Arial, sans-serif;
    color: #172033;
  `;

  /*
  |--------------------------------------------------------------------------
  | Header
  |--------------------------------------------------------------------------
  */

  const header = doc.createElement("div");

  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 24px;
  `;

  const headingBox = doc.createElement("div");

  const heading = doc.createElement("h2");

  heading.textContent = "AMC Status";

  heading.style.cssText = `
    margin: 0;
    font-size: 25px;
    font-weight: 700;
  `;

  const subtitle = doc.createElement("p");

  subtitle.textContent =
    "Annual Maintenance Contract information";

  subtitle.style.cssText = `
    margin: 7px 0 0;
    color: #64748b;
    font-size: 14px;
  `;

  headingBox.appendChild(heading);
  headingBox.appendChild(subtitle);

  const closeButton =
    doc.createElement("button");

  closeButton.type = "button";
  closeButton.textContent = "×";

  closeButton.style.cssText = `
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 10px;
    background: #f1f5f9;
    color: #334155;
    font-size: 25px;
    line-height: 1;
    cursor: pointer;
  `;

  header.appendChild(headingBox);
  header.appendChild(closeButton);

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const summaryGrid =
    doc.createElement("div");

  summaryGrid.className =
    "skytech-amc-summary";

  summaryGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 24px;
  `;

  const createSummaryCard = (
    label,
    value
  ) => {
    const box = doc.createElement("div");

    box.style.cssText = `
      padding: 18px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    `;

    const labelEl =
      doc.createElement("div");

    labelEl.textContent = label;

    labelEl.style.cssText = `
      color: #64748b;
      font-size: 13px;
      margin-bottom: 7px;
    `;

    const valueEl =
      doc.createElement("div");

    valueEl.textContent =
      safeText(value);

    valueEl.style.cssText = `
      color: #0f172a;
      font-size: 21px;
      font-weight: 700;
    `;

    box.appendChild(labelEl);
    box.appendChild(valueEl);

    return box;
  };

  summaryGrid.appendChild(
    createSummaryCard(
      "AMC Contracts",
      contracts.length
    )
  );

  summaryGrid.appendChild(
    createSummaryCard(
      "Active AMC",
      activeAmc
    )
  );

  summaryGrid.appendChild(
    createSummaryCard(
      "Overall Status",
      overallStatus
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Contract Details
  |--------------------------------------------------------------------------
  */

  const contractSection =
    doc.createElement("div");

  const contractTitle =
    doc.createElement("h3");

  contractTitle.textContent =
    "Contract Details";

  contractTitle.style.cssText = `
    margin: 0 0 14px;
    font-size: 17px;
    font-weight: 700;
  `;

  contractSection.appendChild(
    contractTitle
  );

  if (contracts.length === 0) {
    const empty =
      doc.createElement("div");

    empty.textContent =
      "No AMC contract details are currently available.";

    empty.style.cssText = `
      padding: 18px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    `;

    contractSection.appendChild(
      empty
    );
  } else {
    contracts.forEach(
      (contract, index) => {
        const item =
          doc.createElement("div");

        item.style.cssText = `
          padding: 18px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
        `;

        const contractCode =
          contract?.contract_code ??
          contract?.amc_code ??
          contract?.contract_id ??
          `Contract ${index + 1}`;

        const status =
          contract?.status ??
          contract?.amc_status ??
          "Unknown";

        const startDate =
          contract?.start_date ?? "-";

        const endDate =
          contract?.end_date ??
          contract?.expiry_date ??
          "-";

        const amount =
          contract?.amount ??
          contract?.contract_value ??
          contract?.amc_value ??
          "-";

        const equipment =
          contract?.equipment_name ??
          contract?.equipment ??
          contract?.equipment_type ??
          "-";

        const title =
          doc.createElement("div");

        title.textContent =
          safeText(contractCode);

        title.style.cssText = `
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
        `;

        item.appendChild(title);

        const createRow = (
          label,
          value
        ) => {
          const row =
            doc.createElement("div");

          row.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 7px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          `;

          const left =
            doc.createElement("span");

          left.textContent = label;
          left.style.color =
            "#64748b";

          const right =
            doc.createElement("span");

          right.textContent =
            safeText(value);

          right.style.fontWeight =
            "600";

          row.appendChild(left);
          row.appendChild(right);

          return row;
        };

        item.appendChild(
          createRow(
            "Status",
            status
          )
        );

        item.appendChild(
          createRow(
            "Equipment",
            equipment
          )
        );

        item.appendChild(
          createRow(
            "Start Date",
            startDate
          )
        );

        item.appendChild(
          createRow(
            "End Date",
            endDate
          )
        );

        item.appendChild(
          createRow(
            "Contract Value",
            amount
          )
        );

        contractSection.appendChild(
          item
        );
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Footer
  |--------------------------------------------------------------------------
  */

  const footer =
    doc.createElement("div");

  footer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
    flex-wrap: wrap;
  `;

  const closeFooterButton =
    doc.createElement("button");

  closeFooterButton.type = "button";
  closeFooterButton.textContent =
    "Close";

  closeFooterButton.style.cssText = `
    padding: 11px 18px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #ffffff;
    color: #334155;
    font-weight: 600;
    cursor: pointer;
  `;

  const requestButton =
    doc.createElement("button");

  requestButton.type = "button";

  requestButton.textContent =
    "Request AMC Service";

  requestButton.style.cssText = `
    padding: 11px 18px;
    border: none;
    border-radius: 9px;
    background: #0b4dbb;
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
  `;

  /*
  |--------------------------------------------------------------------------
  | Close modal
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    modal.remove();

    if (
      responsiveStyle &&
      responsiveStyle.parentNode
    ) {
      responsiveStyle.remove();
    }
  };

  closeButton.addEventListener(
    "click",
    closeModal
  );

  closeFooterButton.addEventListener(
    "click",
    closeModal
  );

  requestButton.addEventListener(
    "click",
    () => {
      closeModal();

      navigate(
        "/portal/amc-request"
      );
    }
  );

  modal.addEventListener(
    "click",
    (event) => {
      if (
        event.target === modal
      ) {
        closeModal();
      }
    }
  );

  footer.appendChild(
    closeFooterButton
  );

  footer.appendChild(
    requestButton
  );

  card.appendChild(header);
  card.appendChild(summaryGrid);
  card.appendChild(contractSection);
  card.appendChild(footer);

  modal.appendChild(card);

  doc.body.appendChild(modal);

  /*
  |--------------------------------------------------------------------------
  | Responsive styles
  |--------------------------------------------------------------------------
  */

  const responsiveStyle =
    doc.createElement("style");

  responsiveStyle.id =
    "skytech-amc-responsive-style";

  responsiveStyle.textContent = `
    @media (max-width: 600px) {

      #skytech-amc-status-modal {
        padding: 12px !important;
      }

      #skytech-amc-status-modal > div {
        padding: 20px !important;
      }

      #skytech-amc-status-modal
      .skytech-amc-summary {
        grid-template-columns:
          1fr !important;
      }

      #skytech-amc-status-modal
      .skytech-amc-summary + div {
        width: 100%;
      }

    }
  `;

  doc.head.appendChild(
    responsiveStyle
  );
}

/*
|--------------------------------------------------------------------------
| Dashboard Component
|--------------------------------------------------------------------------
*/

export default function CustomerDashboard() {
  const navigate =
    useNavigate();

  /*
  |--------------------------------------------------------------------------
  | API data references
  |--------------------------------------------------------------------------
  */

  const dashboardDataRef =
    useRef(null);

  const equipmentDataRef =
    useRef([]);

  const dashboardDocRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Update original Stitch dashboard
  |--------------------------------------------------------------------------
  */

  const updateDashboardData =
    useCallback(
      (
        doc,
        dashboardData,
        equipment
      ) => {
        if (
          !doc ||
          !dashboardData
        ) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Customer
        |--------------------------------------------------------------------------
        */

        const customer =
          dashboardData?.customer ||
          {};

        const name =
          customer?.name ||
          dashboardData?.name ||
          dashboardData?.customer_name ||
          dashboardData?.user_name;

        if (name) {
          /*
           * Existing Stitch data attribute.
           */

          doc
            .querySelectorAll(
              "[data-customer-name]"
            )
            .forEach((element) => {
              element.textContent =
                String(name);
            });

          /*
           * Fallback for the existing
           * "Welcome back, Customer." text.
           */

          doc
            .querySelectorAll(
              "h1, h2, h3, p, span, div"
            )
            .forEach((element) => {
              const text =
                normalize(
                  element.textContent
                );

              if (
                text ===
                "welcome back, customer."
              ) {
                element.textContent =
                  `Welcome back, ${name}.`;
              }
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Equipment count
        |--------------------------------------------------------------------------
        */

        const equipmentCount =
          dashboardData?.equipment_count ??
          dashboardData?.total_equipment ??
          (Array.isArray(equipment)
            ? equipment.length
            : 0);

        /*
         * Existing data attribute.
         */

        doc
          .querySelectorAll(
            "[data-equipment-count]"
          )
          .forEach((element) => {
            element.textContent =
              String(
                equipmentCount
              );
          });

        /*
         * Existing Stitch ID.
         */

        const equipmentCountElement =
          doc.getElementById(
            "equipment-count"
          );

        if (
          equipmentCountElement
        ) {
          equipmentCountElement.textContent =
            String(
              equipmentCount
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AMC count
        |--------------------------------------------------------------------------
        */

        const amcCount =
          dashboardData?.amc_count ??
          dashboardData?.active_amc ??
          dashboardData?.active_amc_count ??
          0;

        doc
          .querySelectorAll(
            "[data-amc-count]"
          )
          .forEach((element) => {
            element.textContent =
              String(amcCount);
          });

        const amcCountElement =
          doc.getElementById(
            "amc-count"
          );

        if (
          amcCountElement
        ) {
          amcCountElement.textContent =
            String(amcCount);
        }

        /*
        |--------------------------------------------------------------------------
        | Open request count
        |--------------------------------------------------------------------------
        |
        | Backend currently returns:
        |
        | service_requests
        |
        */

        const requestCount =
          dashboardData?.service_requests ??
          dashboardData?.request_count ??
          dashboardData?.open_requests ??
          0;

        doc
          .querySelectorAll(
            "[data-request-count]"
          )
          .forEach((element) => {
            element.textContent =
              String(requestCount);
          });

        const requestCountElement =
          doc.getElementById(
            "request-count"
          );

        if (
          requestCountElement
        ) {
          requestCountElement.textContent =
            String(requestCount);
        }

        /*
        |--------------------------------------------------------------------------
        | Existing Stitch My Equipment section
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | We do NOT replace the dashboard design.
        |
        | We only update the existing Stitch
        | equipment card.
        |
        */

        const equipmentContainer =
          doc.querySelector(
            "#equipment-container"
          );

        if (
          equipmentContainer
        ) {
          const existingCard =
            equipmentContainer.querySelector(
              ".equipment-card"
            );

          /*
          |--------------------------------------------------------------------------
          | No equipment
          |--------------------------------------------------------------------------
          */

          if (
            !Array.isArray(
              equipment
            ) ||
            equipment.length === 0
          ) {
            if (
              existingCard
            ) {
              const nameElement =
                existingCard.querySelector(
                  ".equipment-name"
                );

              const modelElement =
                existingCard.querySelector(
                  ".equipment-model"
                );

              const statusElement =
                existingCard.querySelector(
                  ".status-badge"
                );

              if (
                nameElement
              ) {
                nameElement.textContent =
                  "No equipment registered";
              }

              if (
                modelElement
              ) {
                modelElement.textContent =
                  "No equipment is currently linked to your account.";
              }

              if (
                statusElement
              ) {
                statusElement.innerHTML = `
                  <span
                    class="material-symbols-outlined"
                    style="font-size:12px;"
                  >
                    info
                  </span>
                  No Equipment
                `;
              }
            }
          } else {
            /*
            |--------------------------------------------------------------------------
            | Equipment exists
            |--------------------------------------------------------------------------
            */

            equipment.forEach(
              (item, index) => {
                let card = null;

                /*
                 * First record uses the
                 * original Stitch card.
                 */

                if (
                  index === 0 &&
                  existingCard
                ) {
                  card =
                    existingCard;
                } else if (
                  existingCard
                ) {
                  /*
                   * Additional equipment
                   * uses the same original
                   * Stitch card design.
                   */

                  card =
                    existingCard.cloneNode(
                      true
                    );

                  equipmentContainer.appendChild(
                    card
                  );
                }

                if (!card) {
                  return;
                }

                /*
                |--------------------------------------------------------------------------
                | Equipment values
                |--------------------------------------------------------------------------
                */

                const equipmentName =
                  item?.equipment_name ||
                  item?.equipment_type ||
                  item?.name ||
                  "Equipment";

                const equipmentModel =
                  item?.model ||
                  item?.equipment_code ||
                  item?.serial_number ||
                  "-";

                const status =
                  item?.status ||
                  "Active";

                /*
                |--------------------------------------------------------------------------
                | Existing Stitch elements
                |--------------------------------------------------------------------------
                */

                const nameElement =
                  card.querySelector(
                    ".equipment-name"
                  );

                const modelElement =
                  card.querySelector(
                    ".equipment-model"
                  );

                const statusElement =
                  card.querySelector(
                    ".status-badge"
                  );

                if (
                  nameElement
                ) {
                  nameElement.textContent =
                    String(
                      equipmentName
                    );
                }

                if (
                  modelElement
                ) {
                  modelElement.textContent =
                    String(
                      equipmentModel
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Existing Stitch status badge
                |--------------------------------------------------------------------------
                */

                if (
                  statusElement
                ) {
                  const normalizedStatus =
                    normalize(
                      status
                    );

                  let statusText =
                    String(
                      status
                    );

                  let statusIcon =
                    "check_circle";

                  if (
                    normalizedStatus.includes(
                      "maintenance"
                    ) ||
                    normalizedStatus.includes(
                      "service"
                    ) ||
                    normalizedStatus ===
                      "pending"
                  ) {
                    statusText =
                      "Service";

                    statusIcon =
                      "build";
                  } else if (
                    normalizedStatus ===
                      "inactive" ||
                    normalizedStatus ===
                      "offline" ||
                    normalizedStatus ===
                      "decommissioned"
                  ) {
                    statusIcon =
                      "info";
                  }

                  statusElement.innerHTML = `
                    <span
                      class="material-symbols-outlined"
                      style="font-size:12px;"
                    >
                      ${statusIcon}
                    </span>
                    ${statusText}
                  `;
                }
              }
            );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Console
        |--------------------------------------------------------------------------
        */

        console.log(
          "SKYTECH Customer Dashboard:",
          {
            dashboardData,
            equipment,
          }
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Load Dashboard API
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const loadDashboard =
      async () => {
        try {
          /*
          |--------------------------------------------------------------------------
          | Dashboard summary
          |--------------------------------------------------------------------------
          */

          const data =
            await apiFetch(
              "/api/customer/dashboard"
            );

          if (
            cancelled
          ) {
            return;
          }

          dashboardDataRef.current =
            data || null;

          /*
          |--------------------------------------------------------------------------
          | Equipment records
          |--------------------------------------------------------------------------
          */

          try {
            const equipmentData =
              await apiFetch(
                "/api/customer/equipment"
              );

            if (
              cancelled
            ) {
              return;
            }

            if (
              Array.isArray(
                equipmentData
              )
            ) {
              equipmentDataRef.current =
                equipmentData;
            } else if (
              Array.isArray(
                equipmentData?.equipment
              )
            ) {
              equipmentDataRef.current =
                equipmentData.equipment;
            } else if (
              Array.isArray(
                equipmentData?.data
              )
            ) {
              equipmentDataRef.current =
                equipmentData.data;
            } else {
              equipmentDataRef.current =
                [];
            }
          } catch (
            equipmentError
          ) {
            console.error(
              "SKYTECH Customer Equipment API Error:",
              equipmentError
            );

            equipmentDataRef.current =
              [];
          }

          /*
          |--------------------------------------------------------------------------
          | Update iframe if already ready
          |--------------------------------------------------------------------------
          */

          if (
            dashboardDocRef.current
          ) {
            updateDashboardData(
              dashboardDocRef.current,
              dashboardDataRef.current,
              equipmentDataRef.current
            );
          }
        } catch (
          error
        ) {
          console.error(
            "SKYTECH Customer Dashboard API Error:",
            error
          );
        }
      };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [
    updateDashboardData,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Stitch Dashboard Ready
  |--------------------------------------------------------------------------
  */

  const handleReady =
    useCallback(
      (doc) => {
        if (!doc) {
          return;
        }

        /*
        * Remember iframe document.
        */

        dashboardDocRef.current =
          doc;

        /*
        |--------------------------------------------------------------------------
        | Inject API data
        |--------------------------------------------------------------------------
        */

        updateDashboardData(
          doc,
          dashboardDataRef.current,
          equipmentDataRef.current
        );

        /*
        |--------------------------------------------------------------------------
        | AMC Status button
        |--------------------------------------------------------------------------
        */

        const buttons =
          doc.querySelectorAll(
            "button, a, [role='button'], [data-route]"
          );

        buttons.forEach(
          (button) => {
            if (
              button.dataset
                .skytechAmcBound ===
              "true"
            ) {
              return;
            }

            const text =
              normalize(
                button.textContent
              );

            if (
              !text.includes(
                "amc status"
              )
            ) {
              return;
            }

            button.dataset
              .skytechAmcBound =
              "true";

            button.addEventListener(
              "click",
              (event) => {
                event.preventDefault();
                event.stopPropagation();

                openAmcStatus(
                  doc,
                  navigate,
                  dashboardDataRef.current
                );
              }
            );
          }
        );
      },
      [
        navigate,
        updateDashboardData,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Render ORIGINAL Stitch dashboard
  |--------------------------------------------------------------------------
  */

  return (
    <CustomerPortalShell
      activeRoute="/portal/dashboard"
      iframeSrc="/stitch/customer_dashboard_skytech_electricals/code.html"
      title="SKYTECH Customer Dashboard"
      onReady={handleReady}
    />
  );
}