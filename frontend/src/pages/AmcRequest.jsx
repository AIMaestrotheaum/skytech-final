import { useState } from "react";

import { useNavigate } from "react-router-dom";

import CustomerPortalShell from "../components/CustomerPortalShell";

import { apiFetch } from "../utils/api";

export default function AmcRequest() {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [form, setForm] = useState({
    equipment: "",
    company: "",
    currentAmc: "No",
    startDate: "",
    duration: "1 Year",
    requirements: "",
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
  // SUBMIT AMC REQUEST
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    setSubmitted(false);

    setRequestCode("");

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!form.equipment) {
      setError("Please select your equipment type.");
      return;
    }

    if (!form.company.trim()) {
      setError(
        "Please enter your company / organization name."
      );
      return;
    }

    if (!form.startDate) {
      setError(
        "Please select your preferred AMC start date."
      );
      return;
    }

    if (!form.requirements.trim()) {
      setError(
        "Please enter your AMC requirements or additional details."
      );
      return;
    }

    if (form.requirements.trim().length < 5) {
      setError(
        "AMC requirements must contain at least 5 characters."
      );
      return;
    }

    // --------------------------------------------------------
    // SUBMIT
    // --------------------------------------------------------

    try {
      setLoading(true);

      // ------------------------------------------------------
      // Backend currently accepts:
      //
      // equipment_id
      // company
      // issue
      // priority
      //
      // The Equipment field here represents an equipment TYPE,
      // not a customer_equipment database ID.
      //
      // Therefore equipment type and the remaining AMC details
      // are preserved inside the issue text.
      // ------------------------------------------------------

      let finalIssue =
        `Equipment Type: ${form.equipment}` +
        `\nExisting AMC: ${form.currentAmc}` +
        `\nAMC Duration: ${form.duration}` +
        `\nPreferred AMC Start Date: ${form.startDate}` +
        `\n\nRequirements / Additional Details:\n${form.requirements.trim()}`;

      // ------------------------------------------------------
      // API PAYLOAD
      // ------------------------------------------------------

      const payload = {
        equipment_id: null,
        company: form.company.trim(),
        issue: finalIssue,
        priority: "normal",
      };

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response = await apiFetch(
        "/api/customer/amc-requests",
        {
          method: "POST",
          body: payload,
        }
      );

      const data = await response.json();

      // ------------------------------------------------------
      // BACKEND ERROR
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to submit AMC request."
        );
      }

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      setSubmitted(true);

      setRequestCode(data?.request_code || "");

      // Clear form after successful submission

      setForm({
        equipment: "",
        company: "",
        currentAmc: "No",
        startDate: "",
        duration: "1 Year",
        requirements: "",
      });
    } catch (err) {
      console.error(
        "AMC request submission error:",
        err
      );

      setError(
        err?.message ||
          "Unable to submit AMC request. Please try again."
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
              AMC Request
            </h1>

            <p
              style={{
                marginTop: "9px",
                marginBottom: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Request an Annual Maintenance Contract for your equipment.
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
            AMC Request
          </div>
        </div>

        {/* ==================================================
            SUCCESS
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
              AMC request submitted.
            </strong>

            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
              }}
            >
              Your AMC enquiry has been recorded for review.

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
            ERROR
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

                <option value="Other">
                  Other Equipment
                </option>
              </select>
            </div>

            {/* ==================================================
                COMPANY
            =================================================== */}

            <div>
              <label
                htmlFor="company"
                style={labelStyle}
              >
                Company / Organization
              </label>

              <input
                id="company"
                name="company"
                type="text"
                value={form.company}
                onChange={handleChange}
                placeholder="Enter company name"
                disabled={loading}
                style={inputStyle}
              />
            </div>

            {/* ==================================================
                EXISTING AMC
            =================================================== */}

            <div>
              <label
                htmlFor="currentAmc"
                style={labelStyle}
              >
                Existing AMC
              </label>

              <select
                id="currentAmc"
                name="currentAmc"
                value={form.currentAmc}
                onChange={handleChange}
                disabled={loading}
                style={{
                  ...inputStyle,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <option value="No">
                  No
                </option>

                <option value="Yes">
                  Yes
                </option>
              </select>
            </div>

            {/* ==================================================
                DURATION
            =================================================== */}

            <div>
              <label
                htmlFor="duration"
                style={labelStyle}
              >
                AMC Duration
              </label>

              <select
                id="duration"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                disabled={loading}
                style={{
                  ...inputStyle,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <option value="1 Year">
                  1 Year
                </option>

                <option value="2 Years">
                  2 Years
                </option>

                <option value="3 Years">
                  3 Years
                </option>
              </select>
            </div>

            {/* ==================================================
                START DATE
            =================================================== */}

            <div>
              <label
                htmlFor="startDate"
                style={labelStyle}
              >
                Preferred AMC Start Date
              </label>

              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                disabled={loading}
                min={new Date()
                  .toISOString()
                  .split("T")[0]}
                style={inputStyle}
              />
            </div>

            {/* ==================================================
                REQUIREMENTS
            =================================================== */}

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label
                htmlFor="requirements"
                style={labelStyle}
              >
                Requirements / Additional Details
              </label>

              <textarea
                id="requirements"
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                placeholder="Tell us about your AMC requirements..."
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
              borderTop: "1px solid #e2e8f0",
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
                : "Submit AMC Request"}
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
            AMC SERVICE
          </div>

          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Request preventive maintenance and service coverage for your
            registered SKYTECH equipment.
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
      activeRoute="/portal/amc-request"
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
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  padding: "12px 20px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};