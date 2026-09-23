import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminPortalShell from "../../layouts/AdminPortalShell";
import { apiFetch } from "../../utils/api";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (
    value === "qualified" ||
    value === "converted" ||
    value === "resolved" ||
    value === "completed"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    value === "contacted" ||
    value === "in_progress" ||
    value === "assigned"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    value === "critical" ||
    value === "open" ||
    value === "pending"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (value === "closed") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-slate-100 text-slate-600";
}

function StatCard({
  label,
  value,
  icon,
  description,
  link,
}) {
  const content = (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="block no-underline"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default function AdminDashboard() {
  const [data, setData] = useState({
    total_leads: 0,
    open_quotes: 0,
    active_amc: 0,
    service_requests: 0,
    monthly_revenue: 0,
    critical_alerts: [],
    recent_enquiries: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch(
          "/api/admin/dashboard"
        );

        if (!response.ok) {
          let message = `Dashboard API failed: ${response.status}`;

          try {
            const errorData = await response.json();

            if (errorData?.detail) {
              message =
                typeof errorData.detail === "string"
                  ? errorData.detail
                  : JSON.stringify(errorData.detail);
            }
          } catch {
            // Ignore JSON parsing error.
          }

          throw new Error(message);
        }

        const result = await response.json();

        if (!mounted) {
          return;
        }

        setData({
          total_leads: Number(
            result?.total_leads ?? 0
          ),

          open_quotes: Number(
            result?.open_quotes ?? 0
          ),

          active_amc: Number(
            result?.active_amc ?? 0
          ),

          service_requests: Number(
            result?.service_requests ?? 0
          ),

          monthly_revenue: Number(
            result?.monthly_revenue ?? 0
          ),

          critical_alerts: Array.isArray(
            result?.critical_alerts
          )
            ? result.critical_alerts
            : [],

          recent_enquiries: Array.isArray(
            result?.recent_enquiries
          )
            ? result.recent_enquiries
            : [],
        });
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(
          "Admin Dashboard Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load admin dashboard."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminPortalShell activeRoute="/admin">
      <div className="space-y-6">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Overview
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
              Admin Dashboard
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Monitor leads, quotations, AMC contracts and
              service operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/leads"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors no-underline"
            >
              View Leads
            </Link>

            <Link
              to="/admin/service-requests"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors no-underline"
            >
              Service Requests
            </Link>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            KPI CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Leads"
            value={
              loading
                ? "..."
                : data.total_leads.toLocaleString(
                    "en-IN"
                  )
            }
            icon="👥"
            description="All enquiries received"
            link="/admin/leads"
          />

          <StatCard
            label="Open Quotes"
            value={
              loading
                ? "..."
                : data.open_quotes.toLocaleString(
                    "en-IN"
                  )
            }
            icon="📄"
            description="Quotes requiring attention"
            link="/admin/quotes"
          />

          <StatCard
            label="Active AMC"
            value={
              loading
                ? "..."
                : data.active_amc.toLocaleString(
                    "en-IN"
                  )
            }
            icon="🛠️"
            description="Currently active contracts"
            link="/admin/service-amc"
          />

          <StatCard
            label="Service Requests"
            value={
              loading
                ? "..."
                : data.service_requests.toLocaleString(
                    "en-IN"
                  )
            }
            icon="🔧"
            description="Current service workload"
            link="/admin/service-requests"
          />
        </div>

        {/* =====================================================
            REVENUE + CRITICAL ALERTS
        ===================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue */}

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Monthly Revenue
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  {loading
                    ? "..."
                    : formatCurrency(
                        data.monthly_revenue
                      )}
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  Current monthly revenue recorded
                  in the admin system.
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">
                ₹
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Open Quotes
                </p>

                <p className="text-xl font-bold text-slate-900 mt-1">
                  {loading
                    ? "..."
                    : data.open_quotes}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Active AMC
                </p>

                <p className="text-xl font-bold text-slate-900 mt-1">
                  {loading
                    ? "..."
                    : data.active_amc}
                </p>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Critical Alerts
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-1">
                  {loading
                    ? "..."
                    : data.critical_alerts.length}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-xl">
                ⚠️
              </div>
            </div>

            {data.critical_alerts.length > 0 ? (
              <div className="mt-5 space-y-3">
                {data.critical_alerts
                  .slice(0, 3)
                  .map((alert, index) => (
                    <div
                      key={
                        alert.id ||
                        alert.request_id ||
                        index
                      }
                      className="rounded-xl bg-red-50 border border-red-100 p-3"
                    >
                      <p className="text-sm font-semibold text-red-800">
                        {alert.issue ||
                          "Critical service request"}
                      </p>

                      <p className="text-xs text-red-600 mt-1">
                        {alert.company ||
                          alert.customer_name ||
                          "Customer"}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  No critical service alerts.
                </p>
              </div>
            )}

            <Link
              to="/admin/service-requests"
              className="inline-block mt-4 text-sm font-semibold text-slate-900 no-underline hover:underline"
            >
              View service requests →
            </Link>
          </div>
        </div>

        {/* =====================================================
            RECENT ENQUIRIES
        ===================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Lead Management
              </p>

              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Recent Enquiries
              </h2>
            </div>

            <Link
              to="/admin/leads"
              className="text-sm font-semibold text-slate-900 no-underline hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading recent enquiries...
            </div>
          ) : data.recent_enquiries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">
                📭
              </div>

              <p className="text-sm font-medium text-slate-700">
                No recent enquiries
              </p>

              <p className="text-xs text-slate-500 mt-1">
                New enquiries will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lead
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Company
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assigned To
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.recent_enquiries
                    .slice(0, 10)
                    .map((lead, index) => (
                      <tr
                        key={
                          lead.id ||
                          lead.lead_id ||
                          lead.lead_code ||
                          index
                        }
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={
                              lead.id ||
                              lead.lead_id
                                ? `/admin/leads/${
                                    lead.id ||
                                    lead.lead_id
                                  }`
                                : "/admin/leads"
                            }
                            className="font-semibold text-slate-900 no-underline hover:underline"
                          >
                            {lead.lead_code || "-"}
                          </Link>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {lead.customer_name || "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {lead.company || "-"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                              lead.status
                            )}`}
                          >
                            {String(
                              lead.status || "new"
                            )
                              .replaceAll("_", " ")
                              .toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {lead.assigned_to || "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Quickly access the main admin operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/leads"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all no-underline"
            >
              <div className="text-2xl">
                👥
              </div>

              <h3 className="font-semibold text-slate-900 mt-3">
                Manage Leads
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                View and manage customer enquiries.
              </p>
            </Link>

            <Link
              to="/admin/quotes"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all no-underline"
            >
              <div className="text-2xl">
                📄
              </div>

              <h3 className="font-semibold text-slate-900 mt-3">
                Manage Quotes
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Review quotations and pricing.
              </p>
            </Link>

            <Link
              to="/admin/service-amc"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all no-underline"
            >
              <div className="text-2xl">
                🛠️
              </div>

              <h3 className="font-semibold text-slate-900 mt-3">
                Service & AMC
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Manage AMC contracts and service.
              </p>
            </Link>

            <Link
              to="/admin/inventory"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all no-underline"
            >
              <div className="text-2xl">
                📦
              </div>

              <h3 className="font-semibold text-slate-900 mt-3">
                Inventory
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Monitor equipment inventory.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AdminPortalShell>
  );
}