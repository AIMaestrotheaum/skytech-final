import { useCallback } from "react";

import CustomerPortalShell from "../../components/CustomerPortalShell";
import { apiFetch } from "../../utils/api";

export default function ServiceHistory() {
  const loadServiceHistory = useCallback(async (doc) => {
    if (!doc) return;

    const main = doc.querySelector(".main");

    if (!main) {
      console.error(
        "SKYTECH: Customer portal main section not found."
      );
      return;
    }

    // --------------------------------------------------------------------------
    // Service History page
    // --------------------------------------------------------------------------

    main.innerHTML = `
      <div class="topbar">
        <div>
          <h1 class="page-title">Service History</h1>

          <p class="page-subtitle">
            View your equipment service and maintenance history.
          </p>
        </div>

        <div class="online-status">
          <span class="online-dot"></span>

          <span id="service-system-status">
            Loading service history...
          </span>
        </div>
      </div>

      <!-- =========================================================
           SERVICE SUMMARY
           ========================================================= -->

      <section class="stats-grid">

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-label">
              Total Services
            </div>

            <div class="stat-icon">
              <span class="material-symbols-outlined">
                build
              </span>
            </div>
          </div>

          <div
            id="service-total"
            class="stat-value"
          >
            0
          </div>

          <div class="stat-description">
            Recorded service visits
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-label">
              Completed
            </div>

            <div class="stat-icon">
              <span class="material-symbols-outlined">
                check_circle
              </span>
            </div>
          </div>

          <div
            id="service-completed"
            class="stat-value"
          >
            0
          </div>

          <div class="stat-description">
            Completed service visits
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-label">
              Pending
            </div>

            <div class="stat-icon">
              <span class="material-symbols-outlined">
                schedule
              </span>
            </div>
          </div>

          <div
            id="service-pending"
            class="stat-value"
          >
            0
          </div>

          <div class="stat-description">
            Open or scheduled services
          </div>
        </div>

      </section>

      <!-- =========================================================
           SERVICE HISTORY
           ========================================================= -->

      <section class="section">

        <div class="section-header">
          <h2 class="section-title">
            Service Records
          </h2>

          <button
            id="refresh-service-history"
            class="section-link"
            type="button"
          >
            REFRESH ↻
          </button>
        </div>

        <div
          id="service-history-container"
          class="equipment-grid"
        >
          <div class="equipment-card">

            <div class="equipment-top">
              <div class="equipment-icon">
                <span class="material-symbols-outlined">
                  history
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
              Loading service history...
            </div>

            <div class="equipment-model">
              Please wait
            </div>

          </div>
        </div>

      </section>

      <!-- =========================================================
           NOTICE
           ========================================================= -->

      <div class="notice">
        <strong>
          SKYTECH CUSTOMER PORTAL
        </strong>

        <br />

        Service records are associated with your
        registered customer account and equipment.
      </div>
    `;

    // --------------------------------------------------------------------------
    // Refresh
    // --------------------------------------------------------------------------

    const refreshButton = doc.querySelector(
      "#refresh-service-history"
    );

    if (refreshButton) {
      refreshButton.addEventListener("click", () => {
        loadServiceHistory(doc);
      });
    }

    // --------------------------------------------------------------------------
    // API
    // --------------------------------------------------------------------------

    try {
      const response = await apiFetch(
        "/api/customer/service-history"
      );

      if (!response.ok) {
        throw new Error(
          `Service history API failed: ${response.status}`
        );
      }

      const data = await response.json();

      // ------------------------------------------------------------------------
      // Support common API response formats
      // ------------------------------------------------------------------------

      const services =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.service_history)
          ? data.service_history
          : Array.isArray(data?.history)
          ? data.history
          : Array.isArray(data?.services)
          ? data.services
          : [];

      // ------------------------------------------------------------------------
      // Statistics
      // ------------------------------------------------------------------------

      const total = services.length;

      const completed = services.filter((item) => {
        const status = String(
          item?.status || ""
        ).toLowerCase().trim();

        return [
          "completed",
          "complete",
          "closed",
          "resolved",
          "done",
        ].includes(status);
      }).length;

      const pending = services.filter((item) => {
        const status = String(
          item?.status || ""
        ).toLowerCase().trim();

        return [
          "pending",
          "scheduled",
          "open",
          "requested",
          "in progress",
          "in_progress",
        ].includes(status);
      }).length;

      // ------------------------------------------------------------------------
      // Update summary
      // ------------------------------------------------------------------------

      const totalElement = doc.querySelector(
        "#service-total"
      );

      if (totalElement) {
        totalElement.textContent = String(total);
      }

      const completedElement = doc.querySelector(
        "#service-completed"
      );

      if (completedElement) {
        completedElement.textContent = String(completed);
      }

      const pendingElement = doc.querySelector(
        "#service-pending"
      );

      if (pendingElement) {
        pendingElement.textContent = String(pending);
      }

      const systemStatus = doc.querySelector(
        "#service-system-status"
      );

      if (systemStatus) {
        if (pending > 0) {
          systemStatus.textContent =
            `${pending} service request${
              pending === 1 ? "" : "s"
            } open`;
        } else if (total > 0) {
          systemStatus.textContent =
            "All service records up to date";
        } else {
          systemStatus.textContent =
            "No service records";
        }
      }

      // ------------------------------------------------------------------------
      // Service cards
      // ------------------------------------------------------------------------

      const container = doc.querySelector(
        "#service-history-container"
      );

      if (!container) {
        return;
      }

      container.replaceChildren();

      // ------------------------------------------------------------------------
      // No records
      // ------------------------------------------------------------------------

      if (services.length === 0) {
        const emptyCard = doc.createElement("div");

        emptyCard.className = "equipment-card";

        emptyCard.innerHTML = `
          <div class="equipment-top">

            <div class="equipment-icon">
              <span class="material-symbols-outlined">
                history
              </span>
            </div>

            <span class="status-badge">
              <span
                class="material-symbols-outlined"
                style="font-size:12px;"
              >
                info
              </span>

              No Records
            </span>

          </div>

          <div class="equipment-name">
            No Service History
          </div>

          <div class="equipment-model">
            No service records are currently
            associated with your account.
          </div>
        `;

        container.appendChild(emptyCard);

        return;
      }

      // ------------------------------------------------------------------------
      // Create service cards
      // ------------------------------------------------------------------------

      services.forEach((item) => {
        const card = doc.createElement("div");

        card.className = "equipment-card";

        // ----------------------------------------------------------------------
        // Values
        // ----------------------------------------------------------------------

        const serviceId =
          item?.service_request_id ??
          item?.request_id ??
          item?.service_id ??
          item?.id ??
          "-";

        const serviceType =
          item?.service_type ||
          item?.request_type ||
          item?.type ||
          item?.service_name ||
          "Service Visit";

        const equipmentName =
          item?.equipment_name ||
          item?.equipment ||
          item?.equipment_type ||
          "Power Equipment";

        const equipmentCode =
          item?.equipment_code ||
          item?.equipment_id ||
          item?.serial_number ||
          "-";

        const status =
          item?.status ||
          "Completed";

        const serviceDate =
          item?.service_date ||
          item?.completed_at ||
          item?.date ||
          item?.created_at ||
          "-";

        const technician =
          item?.technician_name ||
          item?.technician ||
          item?.engineer_name ||
          "-";

        const description =
          item?.description ||
          item?.remarks ||
          item?.notes ||
          "-";

        // ----------------------------------------------------------------------
        // Status
        // ----------------------------------------------------------------------

        const normalizedStatus = String(
          status
        ).toLowerCase().trim();

        const isCompleted = [
          "completed",
          "complete",
          "closed",
          "resolved",
          "done",
        ].includes(normalizedStatus);

        const isPending = [
          "pending",
          "scheduled",
          "open",
          "requested",
          "in progress",
          "in_progress",
        ].includes(normalizedStatus);

        let statusIcon = "info";

        if (isCompleted) {
          statusIcon = "check_circle";
        } else if (isPending) {
          statusIcon = "schedule";
        }

        // ----------------------------------------------------------------------
        // Card header
        // ----------------------------------------------------------------------

        const top = doc.createElement("div");

        top.className = "equipment-top";

        const icon = doc.createElement("div");

        icon.className = "equipment-icon";

        icon.innerHTML = `
          <span class="material-symbols-outlined">
            build
          </span>
        `;

        const badge = doc.createElement("span");

        badge.className = "status-badge";

        const badgeIcon = doc.createElement("span");

        badgeIcon.className =
          "material-symbols-outlined";

        badgeIcon.style.fontSize = "12px";

        badgeIcon.textContent = statusIcon;

        badge.appendChild(badgeIcon);

        badge.appendChild(
          doc.createTextNode(` ${status}`)
        );

        top.appendChild(icon);
        top.appendChild(badge);

        // ----------------------------------------------------------------------
        // Service title
        // ----------------------------------------------------------------------

        const nameElement =
          doc.createElement("div");

        nameElement.className =
          "equipment-name";

        nameElement.textContent =
          String(serviceType);

        // ----------------------------------------------------------------------
        // Equipment
        // ----------------------------------------------------------------------

        const modelElement =
          doc.createElement("div");

        modelElement.className =
          "equipment-model";

        modelElement.textContent =
          String(equipmentName);

        // ----------------------------------------------------------------------
        // Information
        // ----------------------------------------------------------------------

        const info = doc.createElement("div");

        info.className = "equipment-info";

        const addInfoRow = (
          label,
          value
        ) => {
          const row =
            doc.createElement("div");

          row.className = "info-row";

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
            String(value ?? "-");

          row.appendChild(labelElement);
          row.appendChild(valueElement);

          info.appendChild(row);
        };

        addInfoRow(
          "Service ID",
          serviceId
        );

        addInfoRow(
          "Equipment",
          equipmentCode
        );

        addInfoRow(
          "Service Date",
          serviceDate
        );

        addInfoRow(
          "Technician",
          technician
        );

        if (
          description !== "-" &&
          description !== ""
        ) {
          addInfoRow(
            "Remarks",
            description
          );
        }

        // ----------------------------------------------------------------------
        // Assemble card
        // ----------------------------------------------------------------------

        card.appendChild(top);
        card.appendChild(nameElement);
        card.appendChild(modelElement);
        card.appendChild(info);

        container.appendChild(card);
      });
    } catch (error) {
      console.error(
        "SKYTECH Service History Error:",
        error
      );

      const container = doc.querySelector(
        "#service-history-container"
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
            Unable to load service history
          </div>

          <div class="equipment-model">
            Please refresh the page and try again.
          </div>
        `;

        container.appendChild(errorCard);
      }

      const systemStatus = doc.querySelector(
        "#service-system-status"
      );

      if (systemStatus) {
        systemStatus.textContent =
          "Unable to load service history";
      }
    }
  }, []);

  return (
    <CustomerPortalShell
      activeRoute="/portal/service-history"
      onReady={loadServiceHistory}
    />
  );
}