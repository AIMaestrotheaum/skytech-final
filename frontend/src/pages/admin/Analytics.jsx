import { useEffect, useState } from "react";

import AdminPortalShell from "../../layouts/AdminPortalShell";
import { apiFetch } from "../../utils/api";

function StatCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function formatLabel(value) {
  return String(value || "Unknown")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function getStatusClass(value) {
  const normalized = String(
    value || ""
  )
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");

  if (
    [
      "active",
      "installed",
      "operational",
      "completed",
      "closed",
      "resolved",
      "approved",
    ].includes(normalized)
  ) {
    return {
      bar: "bg-emerald-500",
      badge:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    [
      "inactive",
      "cancelled",
      "canceled",
      "rejected",
      "failed",
      "retired",
    ].includes(normalized)
  ) {
    return {
      bar: "bg-slate-500",
      badge:
        "border-slate-200 bg-slate-100 text-slate-600",
    };
  }

  if (
    [
      "pending",
      "maintenance",
      "service",
      "in progress",
      "open",
    ].includes(normalized)
  ) {
    return {
      bar: "bg-amber-500",
      badge:
        "border-amber-100 bg-amber-50 text-amber-700",
    };
  }

  return {
    bar: "bg-blue-600",
    badge:
      "border-blue-100 bg-blue-50 text-blue-700",
  };
}

function StatusBars({
  title,
  description,
  data,
}) {
  const entries =
    Object.entries(
      data || {}
    );

  const numericEntries =
    entries.map(
      ([label, value]) => [
        label,
        Number(value) || 0,
      ]
    );

  const maxValue = Math.max(
    ...numericEntries.map(
      ([, value]) => value
    ),
    1
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

      <div className="mb-6">

        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          Operational Breakdown
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      {numericEntries.length === 0 ? (

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">
            No status data available.
          </p>
        </div>

      ) : (

        <div className="space-y-5">

          {numericEntries.map(
            ([label, value]) => {
              const percentage =
                Math.round(
                  (value /
                    maxValue) *
                    100
                );

              const styles =
                getStatusClass(
                  label
                );

              return (
                <div
                  key={label}
                >

                  <div className="mb-2 flex items-center justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-2">

                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.bar}`}
                      />

                      <span className="truncate text-sm font-medium text-slate-700">
                        {formatLabel(
                          label
                        )}
                      </span>

                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles.badge}`}
                      >
                        {value}
                      </span>

                    </div>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className={`h-full rounded-full transition-all ${styles.bar}`}
                      style={{
                        width: `${Math.min(
                          percentage,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>
              );
            }
          )}

        </div>

      )}

    </section>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadAnalytics =
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await apiFetch(
            "/api/admin/analytics"
          );

        if (!response.ok) {
          let message =
            `Analytics API failed: ${response.status}`;

          try {
            const data =
              await response.json();

            if (data?.detail) {
              message =
                typeof data.detail ===
                "string"
                  ? data.detail
                  : JSON.stringify(
                      data.detail
                    );
            }
          } catch {
            // Ignore invalid JSON.
          }

          throw new Error(
            message
          );
        }

        const data =
          await response.json();

        setAnalytics(data);
      } catch (err) {
        console.error(
          "Analytics loading error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const summary =
    analytics?.summary || {};

  const customers = Number(
    summary.customers || 0
  );

  const equipment = Number(
    summary.equipment || 0
  );

  const serviceRequests =
    Number(
      summary.service_requests ||
        0
    );

  const leads = Number(
    summary.leads || 0
  );

  const quotes = Number(
    summary.quotes || 0
  );

  const equipmentStatus =
    analytics?.equipment_status ||
    {};

  const serviceStatus =
    analytics?.service_request_status ||
    {};

  const leadStatus =
    analytics?.lead_status || {};

  return (
    <AdminPortalShell
      activeRoute="/admin/analytics"
      title="Analytics"
      subtitle="SKYTECH Digital Power Platform"
    >
      <div className="space-y-6">

        {/* PAGE HEADER */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="p-5 md:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Business Intelligence
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Analytics
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Monitor customers, equipment,
                  service operations, leads and
                  quotation activity across the
                  SKYTECH platform.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  loadAnalytics
                }
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

            </div>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-semibold text-red-800">
              Analytics unavailable
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* KPI CARDS */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Customers"
            value={
              loading
                ? "..."
                : customers
            }
            subtitle="Registered customers"
          />

          <StatCard
            title="Equipment"
            value={
              loading
                ? "..."
                : equipment
            }
            subtitle="Registered assets"
          />

          <StatCard
            title="Service Requests"
            value={
              loading
                ? "..."
                : serviceRequests
            }
            subtitle="Service activity"
          />

          <StatCard
            title="Leads"
            value={
              loading
                ? "..."
                : leads
            }
            subtitle="Sales enquiries"
          />

          <StatCard
            title="Quotes"
            value={
              loading
                ? "..."
                : quotes
            }
            subtitle="Quotation records"
          />

        </section>

        {/* ANALYTICS GRID */}

        {loading ? (

          <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading analytics...
            </p>

          </section>

        ) : (

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            <StatusBars
              title="Equipment Status"
              description="Current operational state of registered equipment."
              data={
                equipmentStatus
              }
            />

            <StatusBars
              title="Service Request Status"
              description="Current distribution of service requests."
              data={
                serviceStatus
              }
            />

            <StatusBars
              title="Lead Status"
              description="Current distribution of sales enquiries."
              data={
                leadStatus
              }
            />

            {/* PLATFORM OVERVIEW */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

              <div className="mb-6">

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Platform Overview
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  SKYTECH Operations
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current system-level record counts.
                </p>

              </div>

              <div className="space-y-3">

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                  <span className="text-sm font-medium text-slate-600">
                    Customers
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {customers}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                  <span className="text-sm font-medium text-slate-600">
                    Equipment
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {equipment}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                  <span className="text-sm font-medium text-slate-600">
                    Service Requests
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {serviceRequests}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                  <span className="text-sm font-medium text-slate-600">
                    Leads
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {leads}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                  <span className="text-sm font-medium text-slate-600">
                    Quotes
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {quotes}
                  </span>

                </div>

              </div>

            </section>

          </div>

        )}

        <div className="text-xs text-slate-500">
          SKYTECH Admin Portal · Business Analytics
        </div>

      </div>
    </AdminPortalShell>
  );
}