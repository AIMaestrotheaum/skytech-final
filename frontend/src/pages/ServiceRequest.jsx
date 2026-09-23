import { useState } from "react";

import { useNavigate } from "react-router-dom";

import CustomerPortalShell from "../components/CustomerPortalShell";

import { apiFetch } from "../utils/api";

export default function ServiceRequest() {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [form, setForm] = useState({
    equipment: "",
    issue: "",
    priority: "normal",
    preferredDate: "",
    description: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const [requestCode, setRequestCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");

    setSubmitted(false);

    setRequestCode("");
  };

  // ==========================================================
  // SUBMIT SERVICE REQUEST
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    setSubmitted(false);

    setRequestCode("");

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!form.equipment) {
      setError("Please select your equipment type.");

      return;
    }

    if (!form.issue.trim()) {
      setError(
        "Please enter the issue with your equipment."
      );

      return;
    }

    if (form.issue.trim().length < 5) {
      setError(
        "Issue must contain at least 5 characters."
      );

      return;
    }

    try {
      setLoading(true);

      // ------------------------------------------------------
      // Current backend endpoint accepts:
      //
      // issue
      // priority
      // equipment_id
      //
      // Equipment dropdown now contains equipment TYPES,
      // not database equipment IDs.
      //
      // Therefore equipment type is preserved inside issue
      // and equipment_id remains null.
      // ------------------------------------------------------

      let finalIssue =
        `Equipment Type: ${form.equipment}\n\n` +
        form.issue.trim();

      if (form.description.trim()) {
        finalIssue +=
          `\n\nDescription:\n${form.description.trim()}`;
      }

      if (form.preferredDate) {
        finalIssue +=
          `\n\nPreferred Service Date: ${form.preferredDate}`;
      }

      // ------------------------------------------------------
      // API payload
      // ------------------------------------------------------

      const payload = {
        issue: finalIssue,
        priority: form.priority,
        equipment_id: null,
      };

      // ------------------------------------------------------
      // API request
      // ------------------------------------------------------

      const response = await apiFetch(
        "/api/customer/service-requests",
        {
          method: "POST",
          body: payload,
        }
      );

      const data = await response.json();

      // ------------------------------------------------------
      // Backend error
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to submit service request."
        );
      }

      // ------------------------------------------------------
      // Success
      // ------------------------------------------------------

      setSubmitted(true);

      setRequestCode(data?.request_code || "");

      // Clear form after successful submission

      setForm({
        equipment: "",
        issue: "",
        priority: "normal",
        preferredDate: "",
        description: "",
      });
    } catch (err) {
      console.error(
        "Service request submission error:",
        err
      );

      setError(
        err?.message ||
          "Unable to submit service request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // PAGE CONTENT
  // ==========================================================

  const content = (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "38px 42px",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        {/* ==================================================
            HEADER
        =================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
            <div
              style={{
                color: "#64748b",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Customer Services
            </div>

            <h1
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: "34px",
                fontWeight: 800,
              }}
            >
              Request Service
            </h1>

            <p
              style={{
                marginTop: "9px",
                marginBottom: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Submit a service request for your
              SKYTECH equipment.
            </p>
          </div>

          <div
            style={{
              background: "#eff6ff",
              color: "#1557b0",
              padding: "10px 15px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Service Request
          </div>
        </div>

        {/* ==================================================
            SUCCESS MESSAGE
        =================================================== */}

        {submitted && (
          <div
            style={{
              background: "#ecfdf3",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "16px 18px",
              marginBottom: "22px",
              color: "#166534",
            }}
          >
            <strong>
              Service request submitted.
            </strong>

            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
              }}
            >
              Your request has been recorded
              successfully.

              {requestCode && (
                <>
                  {" "}
                  Your request code is{" "}
                  <strong>{requestCode}</strong>.
                </>
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            ERROR MESSAGE
        =================================================== */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "16px 18px",
              marginBottom: "22px",
              color: "#b91c1c",
            }}
          >
            <strong>
              Request failed.
            </strong>

            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* ==================================================
            MAIN CARD
        =================================================== */}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            boxShadow:
              "0 3px 12px rgba(15, 23, 42, 0.05)",
            padding: "30px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "22px",
            }}
          >
            {/* ==================================================
                EQUIPMENT
            =================================================== */}

            <div>
              <label
                htmlFor="equipment"
                style={labelStyle}
              >
                Equipment
              </label>

              <select
                id="equipment"
                name="equipment"
                value={form.equipment}
                onChange={handleChange}
                disabled={loading}
                style={{
                  ...inputStyle,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  opacity: loading ? 0.75 : 1,
                }}
              >
                <option value="" disabled>
                  Select equipment
                </option>

                <option value="UPS">
                  UPS
                </option>

                <option value="Three Phase UPS">
                  Three Phase UPS
                </option>

                <option value="Battery System">
                  Battery System
                </option>

                <option value="Other Equipment">
                  Other Equipment
                </option>
              </select>
            </div>

            {/* ==================================================
                PRIORITY
            =================================================== */}

            <div>
              <label
                htmlFor="priority"
                style={labelStyle}
              >
                Priority
              </label>

              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                disabled={loading}
                style={{
                  ...inputStyle,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <option value="low">
                  Low
                </option>

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
            </div>

            {/* ==================================================
                ISSUE
            =================================================== */}

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label
                htmlFor="issue"
                style={labelStyle}
              >
                Issue
              </label>

              <input
                id="issue"
                name="issue"
                type="text"
                value={form.issue}
                onChange={handleChange}
                placeholder="Enter the issue with your equipment"
                disabled={loading}
                style={inputStyle}
              />
            </div>

            {/* ==================================================
                PREFERRED DATE
            =================================================== */}

            <div>
              <label
                htmlFor="preferredDate"
                style={labelStyle}
              >
                Preferred Service Date
              </label>

              <input
                id="preferredDate"
                name="preferredDate"
                type="date"
                value={form.preferredDate}
                onChange={handleChange}
                disabled={loading}
                min={new Date()
                  .toISOString()
                  .split("T")[0]}
                style={inputStyle}
              />
            </div>

            {/* ==================================================
                DESCRIPTION
            =================================================== */}

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label
                htmlFor="description"
                style={labelStyle}
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the problem or service required..."
                rows={6}
                disabled={loading}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "140px",
                }}
              />
            </div>
          </div>

          {/* ==================================================
              ACTIONS
          =================================================== */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "28px",
              paddingTop: "22px",
              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate("/portal/dashboard")
              }
              disabled={loading}
              style={{
                ...secondaryButtonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...primaryButtonStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Submitting..."
                : "Submit Service Request"}
            </button>
          </div>
        </div>

        {/* ==================================================
            INFORMATION
        =================================================== */}

        <div
          style={{
            marginTop: "22px",
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: "12px",
            padding: "18px",
            color: "#1e40af",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "5px",
              textTransform: "uppercase",
            }}
          >
            SKYTECH CUSTOMER PORTAL
          </div>

          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Use this page to request technical
            assistance or maintenance service for
            your registered equipment.
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================================
  // SHELL
  // ==========================================================

  return (
    <CustomerPortalShell
      activeRoute="/portal/service-request"
    >
      {content}
    </CustomerPortalShell>
  );
}

/* ============================================================
   STYLES
============================================================ */

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  padding: "12px 14px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "14px",
  outline: "none",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "9px",
  padding: "12px 20px",
  background: "#1557b0",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  padding: "12px 20px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 700,
};