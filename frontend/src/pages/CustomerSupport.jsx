import { useState } from "react";

import { useNavigate } from "react-router-dom";

import CustomerPortalShell from "../components/CustomerPortalShell";

import { apiFetch } from "../utils/api";

export default function CustomerSupport() {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [form, setForm] = useState({
    subject: "",
    category: "Technical Support",
    priority: "Normal",
    message: "",
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
  // SUBMIT SUPPORT REQUEST
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitted(false);
    setRequestCode("");

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!form.subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (form.subject.trim().length < 3) {
      setError("Subject must contain at least 3 characters.");
      return;
    }

    if (!form.message.trim()) {
      setError("Please enter your message.");
      return;
    }

    if (form.message.trim().length < 5) {
      setError("Message must contain at least 5 characters.");
      return;
    }

    try {
      setLoading(true);

      // ------------------------------------------------------
      // Convert frontend priority values to backend values.
      //
      // Frontend:
      // Normal / High / Critical
      //
      // Backend:
      // low / normal / high / critical
      // ------------------------------------------------------

      const priorityMap = {
        Normal: "normal",
        High: "high",
        Critical: "critical",
      };

      const priority =
        priorityMap[form.priority] || "normal";

      // ------------------------------------------------------
      // API PAYLOAD
      // ------------------------------------------------------

      const payload = {
        subject: form.subject.trim(),
        category: form.category,
        priority,
        message: form.message.trim(),
      };

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response = await apiFetch(
        "/api/customer/support-requests",
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
            "Unable to submit support request."
        );
      }

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      setSubmitted(true);

      setRequestCode(data?.request_code || "");

      // Clear form after successful submission

      setForm({
        subject: "",
        category: "Technical Support",
        priority: "Normal",
        message: "",
      });
    } catch (err) {
      console.error(
        "Support request submission error:",
        err
      );

      setError(
        err?.message ||
          "Unable to submit support request. Please try again."
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
              Customer Support
            </h1>

            <p
              style={{
                marginTop: "9px",
                marginBottom: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Contact SKYTECH support for assistance with your equipment
              and services.
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
            Support
          </div>
        </div>

        {/* ==================================================
            SUPPORT CARDS
        =================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <SupportCard
            title="Technical Support"
            text="Get help with equipment issues, troubleshooting and technical problems."
            icon="⚙"
          />

          <SupportCard
            title="Service Request"
            text="Need an engineer or maintenance visit? Submit a service request."
            icon="🔧"
            onClick={() =>
              navigate("/portal/service-request")
            }
          />

          <SupportCard
            title="AMC Assistance"
            text="Need information about AMC coverage, renewal or maintenance?"
            icon="✓"
            onClick={() =>
              navigate("/portal/amc-request")
            }
          />
        </div>

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
              Support request submitted.
            </strong>

            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
              }}
            >
              Your support message has been recorded.

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
            SUPPORT FORM
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
          <h2
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "21px",
              fontWeight: 800,
            }}
          >
            Contact Support
          </h2>

          <p
            style={{
              marginTop: "7px",
              marginBottom: "25px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Tell us how we can help you.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "22px",
            }}
          >
            {/* ==================================================
                SUBJECT
            =================================================== */}

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label
                htmlFor="subject"
                style={labelStyle}
              >
                Subject
              </label>

              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="What do you need help with?"
                disabled={loading}
                style={inputStyle}
              />
            </div>

            {/* ==================================================
                CATEGORY
            =================================================== */}

            <div>
              <label
                htmlFor="category"
                style={labelStyle}
              >
                Category
              </label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={loading}
                style={{
                  ...inputStyle,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <option value="Technical Support">
                  Technical Support
                </option>

                <option value="Equipment">
                  Equipment
                </option>

                <option value="Service">
                  Service
                </option>

                <option value="AMC">
                  AMC
                </option>

                <option value="Billing">
                  Billing
                </option>

                <option value="Other">
                  Other
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
                <option value="Normal">
                  Normal
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>
              </select>
            </div>

            {/* ==================================================
                MESSAGE
            =================================================== */}

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label
                htmlFor="message"
                style={labelStyle}
              >
                Message
              </label>

              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Describe your issue or question..."
                rows={7}
                disabled={loading}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "160px",
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
                : "Send Support Request"}
            </button>
          </div>
        </div>

        {/* ==================================================
            CONTACT INFORMATION
        =================================================== */}

        <div
          style={{
            marginTop: "22px",
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              color: "#1e40af",
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "10px",
              textTransform: "uppercase",
            }}
          >
            SKYTECH CUSTOMER SUPPORT
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              color: "#475569",
              fontSize: "14px",
            }}
          >
            <div>
              <strong>Email</strong>
              <br />
              support@skytech.com
            </div>

            <div>
              <strong>Service</strong>
              <br />
              Technical & Maintenance Support
            </div>

            <div>
              <strong>Portal</strong>
              <br />
              Customer Service Desk
            </div>
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
      activeRoute="/portal/support"
    >
      {content}
    </CustomerPortalShell>
  );
}

// ============================================================
// SUPPORT CARD
// ============================================================

function SupportCard({
  title,
  text,
  icon,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        textAlign: "left",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "22px",
        boxShadow:
          "0 3px 12px rgba(15, 23, 42, 0.04)",
        cursor: onClick ? "pointer" : "default",
        opacity: onClick ? 1 : 0.95,
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          background: "#eff6ff",
          color: "#1557b0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          marginBottom: "15px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#0f172a",
          fontSize: "16px",
          fontWeight: 800,
          marginBottom: "7px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#64748b",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        {text}
      </div>
    </button>
  );
}

// ============================================================
// STYLES
// ============================================================

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