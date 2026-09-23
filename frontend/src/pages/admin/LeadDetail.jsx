import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import AdminPortalShell from "../../layouts/AdminPortalShell";
import { apiFetch } from "../../utils/api";

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
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status) {
  return String(status || "new")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getStatusClass(status) {
  const value = String(status || "")
    .toLowerCase()
    .trim()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    [
      "qualified",
      "converted",
      "closed_won",
      "completed",
    ].includes(value)
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "contacted",
      "in_progress",
      "assigned",
      "working",
    ].includes(value)
  ) {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (
    [
      "new",
      "pending",
      "open",
    ].includes(value)
  ) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (
    [
      "closed",
      "rejected",
      "lost",
    ].includes(value)
  ) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function InfoItem({
  label,
  value,
  href,
}) {
  const displayValue =
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? "-"
      : String(value);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      {href && displayValue !== "-" ? (
        <a
          href={href}
          className="mt-1 block break-words text-sm font-semibold text-blue-600 no-underline hover:text-blue-700 hover:underline"
        >
          {displayValue}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {displayValue}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-1 text-lg font-bold text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export default function LeadDetail() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadLead() {
      setLoading(true);
      setError("");

      try {
        /*
         * Prefer the route ID:
         *
         * /admin/leads/:id
         *
         * Keep sessionStorage as a backward-compatible
         * fallback for the existing Lead Management flow.
         */

        const storedId =
          sessionStorage.getItem(
            "selected_lead_id"
          );

        const leadId =
          routeId || storedId;

        if (
          leadId === null ||
          leadId === undefined ||
          String(leadId).trim() === ""
        ) {
          throw new Error(
            "No lead ID was provided."
          );
        }

        /*
         * Keep the existing sessionStorage
         * value synchronized.
         */

        sessionStorage.setItem(
          "selected_lead_id",
          String(leadId)
        );

        const response = await apiFetch(
          `/api/admin/leads/${encodeURIComponent(
            leadId
          )}`
        );

        if (!response.ok) {
          let message = `Lead detail API failed: ${response.status}`;

          try {
            const errorData =
              await response.json();

            if (errorData?.detail) {
              message =
                typeof errorData.detail ===
                "string"
                  ? errorData.detail
                  : JSON.stringify(
                      errorData.detail
                    );
            }
          } catch {
            // Ignore invalid JSON.
          }

          throw new Error(message);
        }

        const result =
          await response.json();

        if (!mounted) {
          return;
        }

        /*
         * Support common backend response shapes:
         *
         * { lead: {...} }
         * { data: {...} }
         * {...}
         */

        const actualLead =
          result?.lead ??
          result?.data ??
          result;

        setLead(actualLead || null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(
          "Lead Detail Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load lead details."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadLead();

    return () => {
      mounted = false;
    };
  }, [routeId]);

  const goBack = () => {
    navigate("/admin/leads");
  };

  const customerName =
    lead?.customer_name ??
    lead?.name ??
    lead?.customer ??
    "-";

  const company =
    lead?.company ?? "-";

  const industry =
    lead?.industry ?? "-";

  const requirement =
    lead?.requirement ??
    lead?.requirements ??
    "-";

  const email =
    lead?.email ?? "";

  const phone =
    lead?.phone ??
    lead?.mobile ??
    lead?.contact ??
    "";

  const assignedTo =
    lead?.assigned_to ??
    lead?.assigned_user ??
    lead?.assigned_admin ??
    "-";

  const status =
    lead?.status ?? "new";

  const leadCode =
    lead?.lead_code ??
    lead?.leadCode ??
    lead?.code ??
    lead?.id ??
    "-";

  return (
    <AdminPortalShell
      activeRoute="/admin/leads"
      title="Lead Details"
      subtitle="SKYTECH Digital Power Platform"
    >
      <div className="space-y-6">
        {/* ==================================================
            BACK / BREADCRUMB
        ================================================== */}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/admin"
            className="font-medium text-slate-500 no-underline hover:text-blue-600"
          >
            Dashboard
          </Link>

          <span className="text-slate-300">
            /
          </span>

          <Link
            to="/admin/leads"
            className="font-medium text-slate-500 no-underline hover:text-blue-600"
          >
            Lead Management
          </Link>

          <span className="text-slate-300">
            /
          </span>

          <span className="font-semibold text-slate-800">
            Lead Details
          </span>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-red-800">
                  Unable to load lead
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={goBack}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Back to Leads
              </button>
            </div>
          </section>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading lead details...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while the lead record is
                retrieved.
              </p>
            </div>
          </section>
        ) : lead ? (
          <>
            {/* ==================================================
                LEAD HEADER
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-gradient-to-r from-[#0b1b33] to-[#12315a] p-5 text-white md:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-100">
                        LEAD
                      </span>

                      <span className="font-mono text-sm font-semibold text-white">
                        {leadCode}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          status
                        )}`}
                      >
                        {normalizeStatus(
                          status
                        )}
                      </span>
                    </div>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                      {customerName}
                    </h1>

                    <p className="mt-2 text-sm text-blue-100">
                      {company !== "-"
                        ? company
                        : "Customer enquiry"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      ← Back to Leads
                    </button>

                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1b33] no-underline transition hover:bg-blue-50"
                      >
                        Email Customer
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick information */}

              <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Lead ID
                  </p>

                  <p className="mt-2 font-mono text-sm font-bold text-slate-900">
                    {leadCode}
                  </p>
                </div>

                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Assigned To
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {assignedTo}
                  </p>
                </div>

                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Created
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {formatDate(
                      lead?.created_at ??
                        lead?.createdAt
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* ==================================================
                MAIN INFORMATION
            ================================================== */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Customer */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
                <SectionTitle
                  eyebrow="Customer"
                  title="Customer Information"
                  description="Contact and organization details associated with this enquiry."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoItem
                    label="Customer Name"
                    value={customerName}
                  />

                  <InfoItem
                    label="Company"
                    value={company}
                  />

                  <InfoItem
                    label="Industry"
                    value={industry}
                  />

                  <InfoItem
                    label="Assigned To"
                    value={assignedTo}
                  />

                  <InfoItem
                    label="Email"
                    value={email}
                    href={
                      email
                        ? `mailto:${email}`
                        : undefined
                    }
                  />

                  <InfoItem
                    label="Phone / Mobile"
                    value={phone}
                    href={
                      phone
                        ? `tel:${phone}`
                        : undefined
                    }
                  />
                </div>
              </section>

              {/* Status */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <SectionTitle
                  eyebrow="Lead Status"
                  title="Current Status"
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusClass(
                      status
                    )}`}
                  >
                    {normalizeStatus(status)}
                  </span>

                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formatDateTime(
                        lead?.created_at ??
                          lead?.createdAt
                      )}
                    </p>
                  </div>

                  {lead?.updated_at && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Last Updated
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDateTime(
                          lead.updated_at
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ==================================================
                REQUIREMENT
            ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <SectionTitle
                eyebrow="Requirement"
                title="Customer Requirement"
                description="Requirement information submitted with this lead."
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {requirement}
                </p>
              </div>
            </section>

            {/* ==================================================
                ADDITIONAL DETAILS
            ================================================== */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Contact */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <SectionTitle
                  eyebrow="Contact"
                  title="Contact Information"
                />

                <div className="space-y-3">
                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 no-underline transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Email
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {email}
                        </p>
                      </div>

                      <span className="text-blue-600">
                        →
                      </span>
                    </a>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        No email address available.
                      </p>
                    </div>
                  )}

                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 no-underline transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Phone
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {phone}
                        </p>
                      </div>

                      <span className="text-blue-600">
                        →
                      </span>
                    </a>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        No phone number available.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Assignment */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <SectionTitle
                  eyebrow="Administration"
                  title="Lead Assignment"
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned Administrator
                  </p>

                  <p className="mt-2 text-base font-bold text-slate-900">
                    {assignedTo}
                  </p>

                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lead Reference
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                      {leadCode}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Lead Management
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Use the navigation to continue managing
                    this lead.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    ← All Leads
                  </button>

                  <Link
                    to="/admin/quotes"
                    className="rounded-xl bg-[#0866ff] px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-blue-700"
                  >
                    Quote Management
                  </Link>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              📋
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Lead not found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              The requested lead record could not be
              loaded.
            </p>

            <button
              type="button"
              onClick={goBack}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to Lead Management
            </button>
          </section>
        )}

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            SKYTECH Admin Portal · Lead Details
          </span>

          <Link
            to="/admin/leads"
            className="font-semibold text-slate-700 no-underline hover:text-blue-600"
          >
            ← Back to Lead Management
          </Link>
        </div>
      </div>
    </AdminPortalShell>
  );
}