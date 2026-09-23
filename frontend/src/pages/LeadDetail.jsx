import { useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

export default function LeadDetail() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) return;

    let timeoutId = null;

    const getSelectedLeadId = () =>
      sessionStorage.getItem("selected_lead_id");

    // =========================================================
    // FIND TEXT ELEMENT
    // =========================================================

    const findTextElement = (doc, text) => {
      const main = doc.querySelector("main") || doc.body;

      return Array.from(main.querySelectorAll("*")).find(
        (element) =>
          element.children.length === 0 &&
          element.textContent.trim() === text
      );
    };

    // =========================================================
    // REPLACE EXACT TEXT
    // =========================================================

    const replaceText = (doc, oldText, newText) => {
      const element = findTextElement(doc, oldText);

      if (element) {
        element.textContent = newText || "Not provided";
        return true;
      }

      return false;
    };

    // =========================================================
    // REPLACE TEXT AFTER LABEL
    // =========================================================

    const replaceAfterLabel = (doc, label, value) => {
      const labelElement = findTextElement(doc, label);

      if (!labelElement) return false;

      const parent = labelElement.parentElement;

      if (!parent) return false;

      const leafElements = Array.from(
        parent.querySelectorAll("*")
      ).filter(
        (element) =>
          element.children.length === 0 &&
          element !== labelElement
      );

      if (leafElements.length > 0) {
        leafElements[leafElements.length - 1].textContent =
          value || "Not provided";

        return true;
      }

      return false;
    };

    // =========================================================
    // CREATE EDIT PANEL
    // =========================================================

    const createEditPanel = (doc, lead) => {
      const main = doc.querySelector("main") || doc.body;

      // Prevent duplicate panel
      const existing = doc.querySelector(
        "#skytech-lead-edit-panel"
      );

      if (existing) {
        existing.remove();
      }

      const panel = doc.createElement("div");

      panel.id = "skytech-lead-edit-panel";

      panel.style.cssText = `
        margin: 24px 0;
        padding: 24px;
        border: 1px solid #d9dde5;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        font-family: Inter, Arial, sans-serif;
      `;

      panel.innerHTML = `
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            margin-bottom:20px;
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
              Update Lead
            </h2>

            <p
              style="
                margin:6px 0 0;
                color:#666;
                font-size:14px;
              "
            >
              Update lead information and assignment.
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
            ${lead.lead_code || "-"}
          </span>
        </div>

        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(auto-fit,minmax(220px,1fr));
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
              id="lead-edit-status"
              style="
                width:100%;
                padding:11px 12px;
                border:1px solid #c5c6cd;
                border-radius:7px;
                background:#fff;
              "
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="in_progress">In Progress</option>
              <option value="site_visit">Site Visit</option>
              <option value="proposal">Proposal</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
              <option value="lost">Lost</option>
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
              Assigned To
            </label>

            <input
              id="lead-edit-assigned"
              type="text"
              value="${lead.assigned_to || ""}"
              placeholder="Enter engineer name"
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
              Industry
            </label>

            <input
              id="lead-edit-industry"
              type="text"
              value="${lead.industry || ""}"
              placeholder="Enter industry"
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
              Requirement
            </label>

            <input
              id="lead-edit-requirement"
              type="text"
              value="${lead.requirement || ""}"
              placeholder="Enter requirement"
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
            id="lead-save-button"
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
            id="lead-save-message"
            style="
              font-size:14px;
              font-weight:500;
            "
          ></span>
        </div>
      `;

      main.prepend(panel);

      // Set current status
      const statusSelect = doc.querySelector(
        "#lead-edit-status"
      );

      if (statusSelect) {
        statusSelect.value = lead.status || "new";
      }

      const saveButton = doc.querySelector(
        "#lead-save-button"
      );

      const message = doc.querySelector(
        "#lead-save-message"
      );

      if (!saveButton) return;

      saveButton.addEventListener(
        "click",
        async () => {
          const leadId = getSelectedLeadId();

          if (!leadId) {
            message.textContent = "Lead ID not found.";
            message.style.color = "#c62828";
            return;
          }

          const status =
            doc.querySelector("#lead-edit-status")?.value ||
            null;

          const assignedTo =
            doc
              .querySelector("#lead-edit-assigned")
              ?.value.trim() || null;

          const industry =
            doc
              .querySelector("#lead-edit-industry")
              ?.value.trim() || null;

          const requirement =
            doc
              .querySelector("#lead-edit-requirement")
              ?.value.trim() || null;

          const payload = {
            status,
            assigned_to: assignedTo,
            industry,
            requirement,
          };

          try {
            saveButton.disabled = true;

            saveButton.textContent = "Saving...";

            message.textContent = "";

            const response = await apiFetch(
              `/api/admin/leads/${leadId}`,
              {
                method: "PUT",
                body: payload,
              }
            );

            if (!response.ok) {
              let errorMessage =
                `Update failed: ${response.status}`;

              try {
                const errorData = await response.json();

                if (
                  typeof errorData.detail === "string"
                ) {
                  errorMessage = errorData.detail;
                }
              } catch {
                // Keep default message
              }

              throw new Error(errorMessage);
            }

            const updatedLead = await response.json();

            console.log(
              "Lead updated:",
              updatedLead
            );

            message.textContent =
              "Lead updated successfully.";

            message.style.color = "#16803c";

            // Refresh visible Stitch data
            renderLead(doc, updatedLead);

            saveButton.textContent = "Saved";

            setTimeout(() => {
              saveButton.textContent = "Save Changes";
            }, 1500);
          } catch (error) {
            console.error(
              "Lead update error:",
              error
            );

            message.textContent =
              error.message ||
              "Failed to update lead.";

            message.style.color = "#c62828";

            saveButton.textContent = "Save Changes";
          } finally {
            saveButton.disabled = false;
          }
        }
      );
    };

    // =========================================================
    // RENDER LEAD
    // =========================================================

    const renderLead = (doc, lead) => {
      replaceText(
        doc,
        "LD-2024-8901",
        lead.lead_code
      );

      replaceText(
        doc,
        "Acme Industrial Upgrade",
        lead.requirement
      );

      replaceText(
        doc,
        "Site Visit Pending",
        lead.status
      );

      replaceText(
        doc,
        "Acme Manufacturing Corp.",
        lead.company
      );

      replaceText(
        doc,
        "Robert Chen",
        lead.customer_name
      );

      replaceText(
        doc,
        "+1 (555) 019-8372",
        lead.phone
      );

      replaceText(
        doc,
        "rchen@acmemfg.com",
        lead.email
      );

      replaceText(
        doc,
        "Trade Show",
        lead.source
      );

      replaceText(
        doc,
        "Client requires a complete overhaul of the main distribution panel in Sector B and the installation of three new heavy-duty capacitor banks to improve power factor. Existing systems are legacy (15+ years old) and experiencing frequent thermal tripping during peak load hours.",
        lead.requirement
      );

      replaceText(
        doc,
        "Sarah Jenkins",
        lead.assigned_to
      );

      if (lead.created_at) {
        const createdDate = new Date(
          lead.created_at
        ).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        replaceText(
          doc,
          "Oct 12, 09:41 AM",
          createdDate
        );
      }

      replaceText(
        doc,
        "Manufacturing",
        lead.industry
      );

      // Update edit fields if panel already exists
      const statusSelect = doc.querySelector(
        "#lead-edit-status"
      );

      const assignedInput = doc.querySelector(
        "#lead-edit-assigned"
      );

      const industryInput = doc.querySelector(
        "#lead-edit-industry"
      );

      const requirementInput = doc.querySelector(
        "#lead-edit-requirement"
      );

      if (statusSelect) {
        statusSelect.value = lead.status || "new";
      }

      if (assignedInput) {
        assignedInput.value =
          lead.assigned_to || "";
      }

      if (industryInput) {
        industryInput.value =
          lead.industry || "";
      }

      if (requirementInput) {
        requirementInput.value =
          lead.requirement || "";
      }
    };

    // =========================================================
    // LOAD LEAD
    // =========================================================

    const loadLead = async () => {
      const doc = iframe.contentDocument;

      if (!doc) return;

      const leadId = getSelectedLeadId();

      if (!leadId) {
        console.error(
          "No selected lead found."
        );
        return;
      }

      try {
        const response = await apiFetch(
          `/api/admin/leads/${leadId}`
        );

        if (!response.ok) {
          throw new Error(
            `Lead detail API failed: ${response.status}`
          );
        }

        const lead = await response.json();

        console.log(
          "Selected Lead:",
          lead
        );

        // Render existing Stitch fields
        renderLead(doc, lead);

        // Add editable admin panel
        createEditPanel(doc, lead);

        console.log(
          "Lead detail rendered successfully."
        );
      } catch (error) {
        console.error(
          "Lead Detail Error:",
          error
        );
      }
    };

    // =========================================================
    // IFRAME LOAD
    // =========================================================

    const handleLoad = () => {
      timeoutId = window.setTimeout(
        loadLead,
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
        title="SKYTECH Lead Detail"
        src="/stitch/lead_detail_skytech_admin/code.html"
        className="block w-full min-h-screen h-screen border-0"
      />
    </div>
  );
}