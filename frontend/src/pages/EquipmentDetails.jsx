import { useCallback, useEffect, useState } from "react";

import CustomerPortalShell from "../../components/CustomerPortalShell";

import { apiFetch } from "../../utils/api";

/*
|--------------------------------------------------------------------------
| Customer Equipment Details
|--------------------------------------------------------------------------
| Original SKYTECH Stitch dashboard design is preserved.
|
| CustomerPortalShell provides:
| - Common customer sidebar
| - Sliding/mobile navigation
| - Logout
| - Common navigation
|
| This page provides:
| - Equipment API data
| - Equipment cards
| - Equipment statistics
| - Loading state
| - Error state
|--------------------------------------------------------------------------
*/

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getEquipmentRecords(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.equipment)) {
    return data.equipment;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getStatus(item) {
  return String(
    item?.status ??
      item?.equipment_status ??
      item?.service_status ??
      "Unknown"
  );
}

function isActive(item) {
  const status = getStatus(item).toLowerCase();

  return (
    status === "active" ||
    status === "running" ||
    status === "operational"
  );
}

function safeValue(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  return String(value);
}

function InfoRow({ label, value, last = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid #e5e7eb",
      }}
    >
      <span
        style={{
          color: "#687180",
          fontSize: "13px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#172033",
          fontSize: "13px",
          fontWeight: 600,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {safeValue(value)}
      </span>
    </div>
  );
}

function createElement(doc, tag, styles = {}) {
  const element = doc.createElement(tag);

  Object.assign(element.style, styles);

  return element;
}

function replaceDashboardMain(
  doc,
  equipment,
  loading,
  error,
  onRefresh
) {
  const main = doc.querySelector(".main");

  if (!main) {
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Clear old dashboard content
  |--------------------------------------------------------------------------
  */

  main.innerHTML = "";

  main.style.boxSizing = "border-box";

  /*
  |--------------------------------------------------------------------------
  | Main wrapper
  |--------------------------------------------------------------------------
  */

  const wrapper = createElement(
    doc,
    "div",
    {
      width: "100%",
      boxSizing: "border-box",
      padding: "0",
      color: "#172033",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Header
  |--------------------------------------------------------------------------
  */

  const header = createElement(
    doc,
    "div",
    {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      marginBottom: "28px",
      flexWrap: "wrap",
    }
  );

  const headingBox = createElement(
    doc,
    "div"
  );

  const eyebrow = createElement(
    doc,
    "div",
    {
      color: "#0759c9",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }
  );

  eyebrow.textContent =
    "CUSTOMER PORTAL";

  const heading = createElement(
    doc,
    "h1",
    {
      margin: "0",
      fontSize: "32px",
      lineHeight: "1.2",
      fontWeight: "700",
      color: "#172033",
    }
  );

  heading.textContent =
    "My Equipment";

  const description = createElement(
    doc,
    "p",
    {
      margin: "8px 0 0",
      color: "#687180",
      fontSize: "15px",
      lineHeight: "1.6",
    }
  );

  description.textContent =
    "View your registered power equipment, specifications and current status.";

  headingBox.appendChild(eyebrow);
  headingBox.appendChild(heading);
  headingBox.appendChild(description);

  /*
  |--------------------------------------------------------------------------
  | Refresh button
  |--------------------------------------------------------------------------
  */

  const refreshButton = createElement(
    doc,
    "button",
    {
      border: "1px solid #0759c9",
      background: "#0759c9",
      color: "#ffffff",
      borderRadius: "6px",
      padding: "11px 17px",
      fontWeight: "700",
      cursor: "pointer",
      whiteSpace: "nowrap",
      fontSize: "13px",
      display: "flex",
      alignItems: "center",
      gap: "7px",
    }
  );

  refreshButton.type = "button";

  const refreshIcon = createElement(
    doc,
    "span"
  );

  refreshIcon.className =
    "material-symbols-outlined";

  refreshIcon.textContent =
    "refresh";

  refreshButton.appendChild(
    refreshIcon
  );

  const refreshText =
    doc.createElement("span");

  refreshText.textContent =
    "Refresh";

  refreshButton.appendChild(
    refreshText
  );

  refreshButton.addEventListener(
    "click",
    () => {
      onRefresh();
    }
  );

  header.appendChild(headingBox);
  header.appendChild(
    refreshButton
  );

  wrapper.appendChild(header);

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error) {
    const errorBox = createElement(
      doc,
      "div",
      {
        background: "#fff1f1",
        border: "1px solid #f0b7b7",
        color: "#9b2525",
        borderRadius: "8px",
        padding: "14px 16px",
        marginBottom: "20px",
        fontSize: "14px",
      }
    );

    errorBox.textContent = error;

    wrapper.appendChild(errorBox);
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    const loadingBox = createElement(
      doc,
      "div",
      {
        background: "#ffffff",
        border: "1px solid #dfe1e7",
        borderRadius: "10px",
        padding: "55px 30px",
        textAlign: "center",
        color: "#687180",
      }
    );

    const loadingIcon = createElement(
      doc,
      "span"
    );

    loadingIcon.className =
      "material-symbols-outlined";

    loadingIcon.style.fontSize =
      "40px";

    loadingIcon.textContent =
      "progress_activity";

    const loadingText =
      doc.createElement("div");

    loadingText.style.marginTop =
      "10px";

    loadingText.textContent =
      "Loading equipment...";

    loadingBox.appendChild(
      loadingIcon
    );

    loadingBox.appendChild(
      loadingText
    );

    wrapper.appendChild(
      loadingBox
    );

    main.appendChild(wrapper);

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const totalEquipment =
    equipment.length;

  const activeEquipment =
    equipment.filter(isActive).length;

  const inactiveEquipment =
    Math.max(
      totalEquipment -
        activeEquipment,
      0
    );

  const statsGrid = createElement(
    doc,
    "div",
    {
      display: "grid",
      gridTemplateColumns:
        "repeat(3, minmax(0, 1fr))",
      gap: "14px",
      marginBottom: "24px",
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Added only to activate the existing responsive CSS
  |--------------------------------------------------------------------------
  */

  statsGrid.className = "skytech-equipment-stats";

  const createStatCard = (
    label,
    value,
    icon
  ) => {
    const card = createElement(
      doc,
      "div",
      {
        background: "#ffffff",
        border: "1px solid #dfe1e7",
        borderRadius: "10px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }
    );

    const iconBox = createElement(
      doc,
      "div",
      {
        width: "42px",
        height: "42px",
        minWidth: "42px",
        borderRadius: "9px",
        background: "#e8f0ff",
        color: "#0759c9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    );

    const iconElement =
      doc.createElement("span");

    iconElement.className =
      "material-symbols-outlined";

    iconElement.textContent = icon;

    iconBox.appendChild(
      iconElement
    );

    const textBox =
      doc.createElement("div");

    const labelElement =
      createElement(
        doc,
        "div",
        {
          color: "#687180",
          fontSize: "12px",
          marginBottom: "4px",
        }
      );

    labelElement.textContent =
      label;

    const valueElement =
      createElement(
        doc,
        "div",
        {
          color: "#172033",
          fontSize: "24px",
          fontWeight: "700",
        }
      );

    valueElement.textContent =
      String(value);

    textBox.appendChild(
      labelElement
    );

    textBox.appendChild(
      valueElement
    );

    card.appendChild(iconBox);
    card.appendChild(textBox);

    return card;
  };

  statsGrid.appendChild(
    createStatCard(
      "Total Equipment",
      totalEquipment,
      "precision_manufacturing"
    )
  );

  statsGrid.appendChild(
    createStatCard(
      "Active Equipment",
      activeEquipment,
      "check_circle"
    )
  );

  statsGrid.appendChild(
    createStatCard(
      "Other Status",
      inactiveEquipment,
      "info"
    )
  );

  wrapper.appendChild(
    statsGrid
  );

  /*
  |--------------------------------------------------------------------------
  | Empty state
  |--------------------------------------------------------------------------
  */

  if (equipment.length === 0) {
    const emptyBox = createElement(
      doc,
      "div",
      {
        background: "#ffffff",
        border: "1px solid #dfe1e7",
        borderRadius: "10px",
        padding: "55px 30px",
        textAlign: "center",
      }
    );

    const emptyIcon =
      doc.createElement("span");

    emptyIcon.className =
      "material-symbols-outlined";

    emptyIcon.style.fontSize =
      "45px";

    emptyIcon.style.color =
      "#8a909b";

    emptyIcon.textContent =
      "precision_manufacturing";

    const emptyHeading =
      createElement(
        doc,
        "h2",
        {
          margin: "10px 0 7px",
          fontSize: "20px",
          color: "#172033",
        }
      );

    emptyHeading.textContent =
      "No Equipment Registered";

    const emptyText =
      createElement(
        doc,
        "p",
        {
          margin: "0",
          color: "#687180",
          fontSize: "14px",
        }
      );

    emptyText.textContent =
      "No equipment is currently linked to your customer account.";

    emptyBox.appendChild(
      emptyIcon
    );

    emptyBox.appendChild(
      emptyHeading
    );

    emptyBox.appendChild(
      emptyText
    );

    wrapper.appendChild(
      emptyBox
    );

    main.appendChild(wrapper);

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Primary equipment summary
  |--------------------------------------------------------------------------
  */

  const primary =
    equipment[0];

  const summaryCard =
    createElement(
      doc,
      "section",
      {
        background: "#ffffff",
        border: "1px solid #dfe1e7",
        borderRadius: "10px",
        padding: "24px",
        marginBottom: "24px",
      }
    );

  const summaryTop =
    createElement(
      doc,
      "div",
      {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        flexWrap: "wrap",
      }
    );

  const summaryInfo =
    doc.createElement("div");

  const typeText =
    createElement(
      doc,
      "div",
      {
        color: "#0759c9",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "7px",
      }
    );

  typeText.textContent =
    safeValue(
      primary?.equipment_type
    ).toUpperCase();

  const equipmentName =
    createElement(
      doc,
      "h2",
      {
        margin: "0",
        fontSize: "24px",
        color: "#172033",
      }
    );

  equipmentName.textContent =
    safeValue(
      primary?.equipment_name
    );

  const equipmentId =
    createElement(
      doc,
      "p",
      {
        margin: "8px 0 0",
        color: "#687180",
        fontFamily: "monospace",
        fontSize: "13px",
      }
    );

  equipmentId.textContent =
    `ID: ${safeValue(
      primary?.equipment_code
    )}`;

  summaryInfo.appendChild(
    typeText
  );

  summaryInfo.appendChild(
    equipmentName
  );

  summaryInfo.appendChild(
    equipmentId
  );

  const statusBox =
    createElement(
      doc,
      "div",
      {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        border: "1px solid #dfe1e7",
        borderRadius: "6px",
        padding: "7px 12px",
        fontSize: "12px",
        fontWeight: "600",
      }
    );

  const statusDot =
    createElement(
      doc,
      "span",
      {
        width: "9px",
        height: "9px",
        borderRadius: "50%",
        background: isActive(
          primary
        )
          ? "#22c55e"
          : "#9ca3af",
      }
    );

  const statusText =
    doc.createElement("span");

  statusText.textContent =
    getStatus(primary);

  statusBox.appendChild(
    statusDot
  );

  statusBox.appendChild(
    statusText
  );

  summaryTop.appendChild(
    summaryInfo
  );

  summaryTop.appendChild(
    statusBox
  );

  summaryCard.appendChild(
    summaryTop
  );

  wrapper.appendChild(
    summaryCard
  );

  /*
  |--------------------------------------------------------------------------
  | Equipment grid
  |--------------------------------------------------------------------------
  */

  const grid = createElement(
    doc,
    "div",
    {
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
    }
  );

  equipment.forEach(
    (item, index) => {
      const card = createElement(
        doc,
        "section",
        {
          background: "#ffffff",
          border: "1px solid #dfe1e7",
          borderRadius: "10px",
          overflow: "hidden",
        }
      );

      /*
       * Card header.
       */

      const cardHeader =
        createElement(
          doc,
          "div",
          {
            padding: "18px 20px",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }
        );

      const cardTitle =
        createElement(
          doc,
          "div",
          {
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }
        );

      const cardIcon =
        doc.createElement("span");

      cardIcon.className =
        "material-symbols-outlined";

      cardIcon.style.color =
        "#0759c9";

      cardIcon.textContent =
        "precision_manufacturing";

      const cardNumber =
        doc.createElement("strong");

      cardNumber.textContent =
        `Equipment #${index + 1}`;

      cardTitle.appendChild(
        cardIcon
      );

      cardTitle.appendChild(
        cardNumber
      );

      cardHeader.appendChild(
        cardTitle
      );

      /*
       * Card body.
       */

      const body = createElement(
        doc,
        "div",
        {
          padding: "20px",
        }
      );

      const rows = [
        [
          "Equipment Name",
          item?.equipment_name,
        ],
        [
          "Equipment Code",
          item?.equipment_code,
        ],
        [
          "Equipment Type",
          item?.equipment_type,
        ],
        [
          "Model",
          item?.model,
        ],
        [
          "Serial Number",
          item?.serial_number,
        ],
        [
          "Capacity",
          item?.capacity,
        ],
        [
          "Installation Date",
          formatDate(
            item?.installation_date
          ),
        ],
        [
          "Warranty End Date",
          formatDate(
            item?.warranty_end_date
          ),
        ],
        [
          "Location",
          item?.location,
        ],
        [
          "Status",
          getStatus(item),
        ],
      ];

      rows.forEach(
        ([label, value], rowIndex) => {
          const row =
            createElement(
              doc,
              "div",
              {
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "20px",
                padding: "12px 0",
                borderBottom:
                  rowIndex ===
                  rows.length - 1
                    ? "none"
                    : "1px solid #e5e7eb",
              }
            );

          const labelElement =
            createElement(
              doc,
              "span",
              {
                color: "#687180",
                fontSize: "13px",
              }
            );

          labelElement.textContent =
            label;

          const valueElement =
            createElement(
              doc,
              "span",
              {
                color: "#172033",
                fontSize: "13px",
                fontWeight: "600",
                textAlign: "right",
                wordBreak: "break-word",
              }
            );

          valueElement.textContent =
            safeValue(value);

          row.appendChild(
            labelElement
          );

          row.appendChild(
            valueElement
          );

          body.appendChild(row);
        }
      );

      card.appendChild(
        cardHeader
      );

      card.appendChild(body);

      grid.appendChild(card);
    }
  );

  wrapper.appendChild(grid);

  /*
  |--------------------------------------------------------------------------
  | Quick actions
  |--------------------------------------------------------------------------
  */

  const quickActions =
    createElement(
      doc,
      "section",
      {
        marginTop: "24px",
        background: "#ffffff",
        border: "1px solid #dfe1e7",
        borderRadius: "10px",
        padding: "20px",
      }
    );

  const quickTitle =
    createElement(
      doc,
      "div",
      {
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#777b85",
        marginBottom: "14px",
      }
    );

  quickTitle.textContent =
    "Quick Actions";

  const actions =
    createElement(
      doc,
      "div",
      {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }
    );

  const serviceHistoryButton =
    createElement(
      doc,
      "button",
      {
        border: "1px solid #cfd5df",
        background: "#ffffff",
        color: "#0759c9",
        borderRadius: "6px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        fontWeight: "600",
      }
    );

  serviceHistoryButton.type =
    "button";

  const historyIcon =
    doc.createElement("span");

  historyIcon.className =
    "material-symbols-outlined";

  historyIcon.textContent =
    "history";

  serviceHistoryButton.appendChild(
    historyIcon
  );

  const historyText =
    doc.createElement("span");

  historyText.textContent =
    "Service History";

  serviceHistoryButton.appendChild(
    historyText
  );

  serviceHistoryButton.addEventListener(
    "click",
    () => {
      window.parent.location.href =
        "/portal/service-history";
    }
  );

  const requestButton =
    createElement(
      doc,
      "button",
      {
        border: "1px solid #cfd5df",
        background: "#ffffff",
        color: "#0759c9",
        borderRadius: "6px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        fontWeight: "600",
      }
    );

  requestButton.type =
    "button";

  const requestIcon =
    doc.createElement("span");

  requestIcon.className =
    "material-symbols-outlined";

  requestIcon.textContent =
    "support_agent";

  requestButton.appendChild(
    requestIcon
  );

  const requestText =
    doc.createElement("span");

  requestText.textContent =
    "Request Service";

  requestButton.appendChild(
    requestText
  );

  requestButton.addEventListener(
    "click",
    () => {
      window.parent.location.href =
        "/portal/service-request";
    }
  );

  actions.appendChild(
    serviceHistoryButton
  );

  actions.appendChild(
    requestButton
  );

  quickActions.appendChild(
    quickTitle
  );

  quickActions.appendChild(
    actions
  );

  wrapper.appendChild(
    quickActions
  );

  /*
  |--------------------------------------------------------------------------
  | Responsive CSS
  |--------------------------------------------------------------------------
  */

  const style =
    doc.createElement("style");

  style.id =
    "skytech-equipment-responsive";

  style.textContent = `
    @media (max-width: 900px) {
      .main {
        padding: 24px 20px !important;
      }
    }

    @media (max-width: 700px) {
      .main {
        padding: 20px 14px !important;
      }

      .main h1 {
        font-size: 26px !important;
      }
    }

    @media (max-width: 600px) {
      .skytech-equipment-stats {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  const oldStyle =
    doc.getElementById(
      "skytech-equipment-responsive"
    );

  if (oldStyle) {
    oldStyle.remove();
  }

  doc.head.appendChild(style);

  /*
  |--------------------------------------------------------------------------
  | Final render
  |--------------------------------------------------------------------------
  */

  main.appendChild(wrapper);
}

/*
|--------------------------------------------------------------------------
| Equipment Details Page
|--------------------------------------------------------------------------
*/

export default function EquipmentDetails() {
  const [
    equipment,
    setEquipment,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadEquipment =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await apiFetch(
            "/api/customer/equipment"
          );

        const records =
          getEquipmentRecords(data);

        setEquipment(records);
      } catch (err) {
        console.error(
          "SKYTECH Customer Equipment Error:",
          err
        );

        setEquipment([]);

        setError(
          err?.message ||
            "Unable to load equipment information."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Load API data.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  /*
  |--------------------------------------------------------------------------
  | Stitch document ready.
  |--------------------------------------------------------------------------
  */

  const handleReady =
    useCallback(
      (doc) => {
        replaceDashboardMain(
          doc,
          equipment,
          loading,
          error,
          loadEquipment
        );
      },
      [
        equipment,
        loading,
        error,
        loadEquipment,
      ]
    );

  return (
    <CustomerPortalShell
      activeRoute="/portal/equipment"
      iframeSrc="/stitch/customer_dashboard_skytech_electricals/code.html"
      title="SKYTECH Customer Equipment"
      onReady={handleReady}
    />
  );
}