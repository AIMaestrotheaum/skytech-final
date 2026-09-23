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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
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
    value === "open" ||
    value === "pending" ||
    value === "new"
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
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
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

function QuickAction({
  to,
  icon,
  title,
  description,
}) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm no-underline transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </Link>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState({
    total_leads: 0,
    open_quotes: 0,
    pending_quotes: 0,
    active_amc: 0,
    service_requests: 0,
    open_service_requests: 0,
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
            // Ignore invalid JSON responses.
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
            result?.open_quotes ??
              result?.pending_quotes ??
              0
          ),

          pending_quotes: Number(
            result?.pending_quotes ??
              result?.open_quotes ??
              0
          ),

          active_amc: Number(
            result?.active_amc ?? 0
          ),

          service_requests: Number(
            result?.service_requests ??
              result?.open_service_requests ??
              0
          ),

          open_service_requests: Number(
            result?.open_service_requests ??
              result?.service_requests ??
              0
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

  const criticalAlerts = data.critical_alerts || [];
  const recentEnquiries =
    data.recent_enquiries || [];

  return (
    <AdminPortalShell activeRoute="/admin">
      <div className="space-y-6">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Admin Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Monitor leads, quotations, AMC contracts,
                equipment and service operations from one
                place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/leads"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-slate-800"
              >
                View Leads
              </Link>

              <Link
                to="/admin/service-requests"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
              >
                Service Requests
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <span className="text-lg">
                ⚠️
              </span>

              <div>
                <p className="font-semibold">
                  Dashboard loading error
                </p>

                <p className="mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            KPI CARDS
        ===================================================== */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Leads"
            value={
              loading
                ? "..."
                : formatNumber(data.total_leads)
            }
            icon="👥"
            description="All customer enquiries"
            link="/admin/leads"
          />

          <StatCard
            label="Open Quotes"
            value={
              loading
                ? "..."
                : formatNumber(data.open_quotes)
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
                : formatNumber(data.active_amc)
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
                : formatNumber(
                    data.service_requests
                  )
            }
            icon="🔧"
            description="Current service workload"
            link="/admin/service-requests"
          />
        </section>

        {/* =====================================================
            REVENUE + ALERTS
        ===================================================== */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Revenue */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Monthly Revenue
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {loading
                    ? "..."
                    : formatCurrency(
                        data.monthly_revenue
                      )}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Current monthly revenue recorded
                  in the admin system.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                ₹
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Leads
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : formatNumber(
                        data.total_leads
                      )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Open Quotes
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : formatNumber(
                        data.open_quotes
                      )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Active AMC
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : formatNumber(
                        data.active_amc
                      )}
                </p>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Critical Alerts
                </p>

                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : criticalAlerts.length}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl">
                ⚠️
              </div>
            </div>

            {criticalAlerts.length > 0 ? (
              <div className="mt-5 space-y-3">
                {criticalAlerts
                  .slice(0, 3)
                  .map((alert, index) => (
                    <div
                      key={
                        alert?.id ||
                        alert?.request_id ||
                        alert?.service_request_id ||
                        index
                      }
                      className="rounded-xl border border-red-100 bg-red-50 p-3"
                    >
                      <p className="text-sm font-semibold text-red-800">
                        {alert?.issue ||
                          "Critical service request"}
                      </p>

                      <p className="mt-1 text-xs text-red-600">
                        {alert?.company ||
                          alert?.customer_name ||
                          "Customer"}
                      </p>

                      {alert?.status && (
                        <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[11px] font-semibold uppercase text-red-700">
                          {String(
                            alert.status
                          ).replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      )}
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
              className="mt-4 inline-block text-sm font-semibold text-slate-900 no-underline hover:underline"
            >
              View service requests →
            </Link>
          </div>
        </section>

        {/* =====================================================
            RECENT ENQUIRIES
        ===================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Lead Management
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
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
            <div className="p-10 text-center text-sm text-slate-500">
              Loading recent enquiries...
            </div>
          ) : recentEnquiries.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-3xl">
                📭
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No recent enquiries
              </p>

              <p className="mt-1 text-xs text-slate-500">
                New enquiries will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lead ID
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Company
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assigned To
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentEnquiries
                    .slice(0, 10)
                    .map((lead, index) => {
                      const leadId =
                        lead?.id ??
                        lead?.lead_id ??
                        lead?.lead_code;

                      const destination =
                        lead?.id ||
                        lead?.lead_id
                          ? `/admin/leads/${
                              lead.id ??
                              lead.lead_id
                            }`
                          : "/admin/leads";

                      const statusText =
                        String(
                          lead?.status || "new"
                        ).replaceAll(
                          "_",
                          " "
                        );

                      return (
                        <tr
                          key={
                            leadId || index
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <Link
                              to={destination}
                              className="font-semibold text-slate-900 no-underline hover:underline"
                            >
                              {lead?.lead_code ||
                                lead?.id ||
                                "-"}
                            </Link>
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-slate-700">
                            {lead?.customer_name ||
                              "-"}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-700">
                            {lead?.company ||
                              "-"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusClass(
                                lead?.status
                              )}`}
                            >
                              {statusText}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {lead?.assigned_to ||
                              "-"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quickly access the main admin operations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              to="/admin/leads"
              icon="👥"
              title="Manage Leads"
              description="View and manage customer enquiries."
            />

            <QuickAction
              to="/admin/quotes"
              icon="📄"
              title="Manage Quotes"
              description="Review quotations and pricing."
            />

            <QuickAction
              to="/admin/service-amc"
              icon="🛠️"
              title="Service & AMC"
              description="Manage AMC contracts and service."
            />

            <QuickAction
              to="/admin/inventory"
              icon="📦"
              title="Inventory"
              description="Monitor equipment inventory."
            />
          </div>
        </section>
      </div>
    </AdminPortalShell>
  );
}