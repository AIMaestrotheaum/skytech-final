import { useCallback, useEffect, useState } from "react";

import CustomerPortalShell from "../../components/CustomerPortalShell";
import { apiFetch } from "../../utils/api";

export default function EquipmentDetails() {
  const [refreshKey, setRefreshKey] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const normalizeStatus = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_")
      .replace(/\s+/g, "_");

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(value);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load equipment into Customer Portal
  |--------------------------------------------------------------------------
  */

  const loadEquipment = useCallback(
    async (doc) => {
      if (!doc) {
        return;
      }

      const main = doc.querySelector(".main");

      if (!main) {
        console.error(
          "SKYTECH: Customer portal main section not found."
        );
        return;
      }

      /*
       * --------------------------------------------------------------
       * Main content
       * --------------------------------------------------------------
       */

      main.innerHTML = `
        <div class="topbar">
          <div>
            <h1 class="page-title">
              My Equipment
            </h1>

            <p class="page-subtitle">
              View and manage your registered SKYTECH power equipment.
            </p>
          </div>

          <div class="online-status">
            <span class="online-dot"></span>

            <span id="equipment-system-status">
              Checking system status...
            </span>
          </div>
        </div>

        <!-- =====================================================
             STATISTICS
             ===================================================== -->

        <section class="stats-grid">

          <div class="stat-card">
            <div class="stat-header">

              <div class="stat-label">
                Total Equipment
              </div>

              <div class="stat-icon">
                <span class="material-symbols-outlined">
                  electrical_services
                </span>
              </div>

            </div>

            <div
              id="equipment-total"
              class="stat-value"
            >
              0
            </div>

            <div class="stat-description">
              Registered equipment
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">

              <div class="stat-label">
                Active Equipment
              </div>

              <div class="stat-icon">
                <span class="material-symbols-outlined">
                  verified
                </span>
              </div>

            </div>

            <div
              id="equipment-active"
              class="stat-value"
            >
              0
            </div>

            <div class="stat-description">
              Currently operational
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">

              <div class="stat-label">
                Service Status
              </div>

              <div class="stat-icon">
                <span class="material-symbols-outlined">
                  build
                </span>
              </div>

            </div>

            <div
              id="equipment-service-status"
              class="stat-value"
            >
              -
            </div>

            <div class="stat-description">
              Equipment monitoring
            </div>
          </div>

        </section>

        <!-- =====================================================
             EQUIPMENT
             ===================================================== -->

        <section class="section">

          <div class="section-header">

            <h2 class="section-title">
              Equipment Details
            </h2>

            <button
              id="refresh-equipment"
              class="section-link"
              type="button"
            >
              REFRESH ↻
            </button>

          </div>

          <div
            id="equipment-container"
            class="equipment-grid"
          >

            <div class="equipment-card">

              <div class="equipment-top">

                <div class="equipment-icon">
                  <span class="material-symbols-outlined">
                    electrical_services
                  </span>
                </div>

                <span class="status-badge">

                  <span
                    class="material-symbols-outlined"
                    style="font-size:12px;"
                  >
                    schedule
                  </span>

                  Loading

                </span>

              </div>

              <div class="equipment-name">
                Loading equipment...
              </div>

              <div class="equipment-model">
                Please wait
              </div>

            </div>

          </div>
        </section>

        <!-- =====================================================
             NOTICE
             ===================================================== -->

        <div class="notice">

          <strong>
            SKYTECH CUSTOMER PORTAL
          </strong>

          <br />

          Your registered equipment, service history,
          maintenance requests and AMC information
          are available from this portal.

        </div>
      `;

      /*
       * --------------------------------------------------------------
       * Refresh button
       * --------------------------------------------------------------
       */

      const refreshButton =
        doc.querySelector("#refresh-equipment");

      if (refreshButton) {
        refreshButton.addEventListener(
          "click",
          () => {
            setRefreshKey((value) => value + 1);
          }
        );
      }

      /*
       * --------------------------------------------------------------
       * API
       * --------------------------------------------------------------
       */

      try {
        const response = await apiFetch(
          "/api/customer/equipment"
        );

        if (!response.ok) {
          let message =
            `Equipment API failed: ${response.status}`;

          try {
            const errorData =
              await response.json();

            if (errorData?.detail) {
              message =
                String(errorData.detail);
            }
          } catch {
            // Ignore invalid error response.
          }

          throw new Error(message);
        }

        const data = await response.json();

        /*
         * Support:
         *
         * [
         *   {...}
         * ]
         *
         * and:
         *
         * {
         *   equipment: [...]
         * }
         */

        const equipment =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.equipment)
            ? data.equipment
            : Array.isArray(data?.data)
            ? data.data
            : [];

        /*
         * ----------------------------------------------------------
         * Statistics
         * ----------------------------------------------------------
         */

        const total = equipment.length;

        const active =
          equipment.filter((item) => {
            const status =
              normalizeStatus(item?.status);

            return [
              "active",
              "installed",
              "operational",
              "online",
              "running",
            ].includes(status);
          }).length;

        const maintenance =
          equipment.filter((item) => {
            const status =
              normalizeStatus(item?.status);

            return [
              "maintenance",
              "service",
              "pending",
              "under_maintenance",
              "under_service",
            ].includes(status);
          }).length;

        /*
         * Total
         */

        const totalElement =
          doc.querySelector(
            "#equipment-total"
          );

        if (totalElement) {
          totalElement.textContent =
            String(total);
        }

        /*
         * Active
         */

        const activeElement =
          doc.querySelector(
            "#equipment-active"
          );

        if (activeElement) {
          activeElement.textContent =
            String(active);
        }

        /*
         * Service status
         */

        const serviceElement =
          doc.querySelector(
            "#equipment-service-status"
          );

        if (serviceElement) {
          if (maintenance > 0) {
            serviceElement.textContent =
              `${maintenance} Service`;
          } else if (total > 0) {
            serviceElement.textContent =
              "Normal";
          } else {
            serviceElement.textContent =
              "-";
          }
        }

        /*
         * Overall status
         */

        const systemStatus =
          doc.querySelector(
            "#equipment-system-status"
          );

        if (systemStatus) {
          if (
            total > 0 &&
            active === total
          ) {
            systemStatus.textContent =
              "All systems operational";
          } else if (
            maintenance > 0
          ) {
            systemStatus.textContent =
              "Service attention required";
          } else if (
            total === 0
          ) {
            systemStatus.textContent =
              "No equipment registered";
          } else {
            systemStatus.textContent =
              "System monitoring active";
          }
        }

        /*
         * ----------------------------------------------------------
         * Equipment cards
         * ----------------------------------------------------------
         */

        const container =
          doc.querySelector(
            "#equipment-container"
          );

        if (!container) {
          return;
        }

        container.replaceChildren();

        /*
         * No equipment
         */

        if (equipment.length === 0) {
          const emptyCard =
            doc.createElement("div");

          emptyCard.className =
            "equipment-card";

          emptyCard.innerHTML = `
            <div class="equipment-top">

              <div class="equipment-icon">
                <span class="material-symbols-outlined">
                  inventory_2
                </span>
              </div>

              <span class="status-badge">

                <span
                  class="material-symbols-outlined"
                  style="font-size:12px;"
                >
                  info
                </span>

                No Equipment

              </span>

            </div>

            <div class="equipment-name">
              No Equipment Registered
            </div>

            <div class="equipment-model">
              No equipment is currently linked
              to your customer account.
            </div>
          `;

          container.appendChild(
            emptyCard
          );

          return;
        }

        /*
         * ----------------------------------------------------------
         * Create equipment cards
         * ----------------------------------------------------------
         */

        equipment.forEach((item) => {
          const card =
            doc.createElement("div");

          card.className =
            "equipment-card";

          /*
           * Values
           */

          const name =
            item?.equipment_name ||
            item?.name ||
            "SKYTECH Power Equipment";

          const model =
            item?.model ||
            item?.equipment_type ||
            "Power System";

          const code =
            item?.equipment_code ||
            item?.code ||
            item?.serial_number ||
            "-";

          const serial =
            item?.serial_number ||
            "-";

          const location =
            item?.location ||
            "-";

          const status =
            item?.status ||
            "Active";

          const normalizedStatus =
            normalizeStatus(status);

          const isActive = [
            "active",
            "installed",
            "operational",
            "online",
            "running",
          ].includes(normalizedStatus);

          const isMaintenance = [
            "maintenance",
            "service",
            "pending",
            "under_maintenance",
            "under_service",
          ].includes(normalizedStatus);

          let statusLabel =
            "Active";

          let statusIcon =
            "check_circle";

          if (isMaintenance) {
            statusLabel =
              "Service";

            statusIcon =
              "build";
          } else if (!isActive) {
            statusLabel =
              String(status);

            statusIcon =
              "info";
          }

          /*
           * Build card.
           *
           * Values are inserted using textContent
           * to avoid unsafe HTML injection.
           */

          const top =
            doc.createElement("div");

          top.className =
            "equipment-top";

          const icon =
            doc.createElement("div");

          icon.className =
            "equipment-icon";

          icon.innerHTML = `
            <span class="material-symbols-outlined">
              electrical_services
            </span>
          `;

          const badge =
            doc.createElement("span");

          badge.className =
            "status-badge";

          const badgeIcon =
            doc.createElement("span");

          badgeIcon.className =
            "material-symbols-outlined";

          badgeIcon.style.fontSize =
            "12px";

          badgeIcon.textContent =
            statusIcon;

          badge.appendChild(
            badgeIcon
          );

          badge.appendChild(
            doc.createTextNode(
              ` ${statusLabel}`
            )
          );

          top.appendChild(icon);
          top.appendChild(badge);

          /*
           * Equipment name
           */

          const nameElement =
            doc.createElement("div");

          nameElement.className =
            "equipment-name";

          nameElement.textContent =
            String(name);

          /*
           * Equipment model
           */

          const modelElement =
            doc.createElement("div");

          modelElement.className =
            "equipment-model";

          modelElement.textContent =
            String(model);

          /*
           * Information section
           */

          const info =
            doc.createElement("div");

          info.className =
            "equipment-info";

          const addInfoRow = (
            label,
            value
          ) => {
            const row =
              doc.createElement("div");

            row.className =
              "info-row";

            const labelElement =
              doc.createElement("span");

            labelElement.className =
              "info-label";

            labelElement.textContent =
              label;

            const valueElement =
              doc.createElement("span");

            valueElement.className =
              "info-value";

            valueElement.textContent =
              String(
                value ?? "-"
              );

            row.appendChild(
              labelElement
            );

            row.appendChild(
              valueElement
            );

            info.appendChild(row);
          };

          addInfoRow(
            "Equipment ID",
            code
          );

          addInfoRow(
            "Serial Number",
            serial
          );

          addInfoRow(
            "Location",
            location
          );

          /*
           * Optional capacity
           */

          if (
            item?.capacity !== null &&
            item?.capacity !== undefined &&
            String(item.capacity).trim() !== ""
          ) {
            addInfoRow(
              "Capacity",
              String(item.capacity)
            );
          }

          /*
           * Optional installation date
           */

          if (
            item?.installation_date
          ) {
            addInfoRow(
              "Installation",
              formatDate(
                item.installation_date
              )
            );
          }

          /*
           * Optional warranty
           */

          if (
            item?.warranty_expiry
          ) {
            addInfoRow(
              "Warranty",
              formatDate(
                item.warranty_expiry
              )
            );
          }

          /*
           * Assemble
           */

          card.appendChild(top);

          card.appendChild(
            nameElement
          );

          card.appendChild(
            modelElement
          );

          card.appendChild(info);

          container.appendChild(
            card
          );
        });
      } catch (error) {
        console.error(
          "SKYTECH Equipment Error:",
          error
        );

        const container =
          doc.querySelector(
            "#equipment-container"
          );

        if (container) {
          container.replaceChildren();

          const errorCard =
            doc.createElement("div");

          errorCard.className =
            "equipment-card";

          errorCard.innerHTML = `
            <div class="equipment-top">

              <div class="equipment-icon">
                <span class="material-symbols-outlined">
                  error
                </span>
              </div>

              <span class="status-badge">

                <span
                  class="material-symbols-outlined"
                  style="font-size:12px;"
                >
                  warning
                </span>

                API Error

              </span>

            </div>

            <div class="equipment-name">
              Unable to load equipment
            </div>

            <div class="equipment-model">
              ${
                error?.message
                  ? String(error.message)
                  : "Please refresh the page and try again."
              }
            </div>
          `;

          container.appendChild(
            errorCard
          );
        }

        const systemStatus =
          doc.querySelector(
            "#equipment-system-status"
          );

        if (systemStatus) {
          systemStatus.textContent =
            "Unable to load equipment";
        }
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Refresh mechanism
  |--------------------------------------------------------------------------
  */

  const handleReady = useCallback(
    (doc) => {
      loadEquipment(doc);
    },
    [loadEquipment, refreshKey]
  );

  /*
  |--------------------------------------------------------------------------
  | Customer Portal
  |--------------------------------------------------------------------------
  */

  return (
    <CustomerPortalShell
      activeRoute="/portal/equipment"
      onReady={handleReady}
    />
  );
}