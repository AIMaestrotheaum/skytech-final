import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

function normalizeLeads(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.leads)) {
    return data.leads;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
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
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (
    [
      "contacted",
      "in_progress",
      "assigned",
      "working",
    ].includes(value)
  ) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (
    [
      "new",
      "pending",
      "open",
    ].includes(value)
  ) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (
    [
      "closed",
      "rejected",
      "lost",
    ].includes(value)
  ) {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function normalizeStatus(status) {
  return String(status || "new")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getLeadId(lead) {
  return (
    lead?.id ??
    lead?.lead_id ??
    lead?.leadId ??
    null
  );
}

function getLeadCode(lead) {
  return (
    lead?.lead_code ??
    lead?.leadCode ??
    lead?.code ??
    getLeadId(lead) ??
    "-"
  );
}

export default function LeadManagement() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        "/api/admin/leads"
      );

      if (!response.ok) {
        let message = `Unable to load leads (${response.status})`;

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            message =
              typeof errorData.detail === "string"
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

      const data = await response.json();

      setLeads(normalizeLeads(data));
    } catch (err) {
      console.error(
        "Lead Management Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load leads."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const statuses = useMemo(() => {
    const values = leads
      .map((lead) =>
        String(lead?.status || "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    return [
      ...new Set(values),
    ];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return leads.filter((lead) => {
      const status =
        String(
          lead?.status || ""
        )
          .trim()
          .toLowerCase();

      if (
        statusFilter !== "all" &&
        status !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        lead?.lead_code,
        lead?.code,
        lead?.id,
        lead?.customer_name,
        lead?.name,
        lead?.customer,
        lead?.company,
        lead?.industry,
        lead?.requirement,
        lead?.requirements,
        lead?.status,
        lead?.assigned_to,
        lead?.assigned_user,
        lead?.email,
        lead?.phone,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    leads,
    search,
    statusFilter,
  ]);

  /*
   * ------------------------------------------------------------
   * Open Lead
   * ------------------------------------------------------------
   *
   * Backend expects:
   *     /api/admin/leads/{lead_id}
   *
   * and lead_id must be an integer.
   *
   * This validation prevents values such as:
   *     <id>
   *     undefined
   *     null
   *     LD-4092
   *
   * from being sent to the backend.
   */
  const openLead = (lead) => {
    const rawLeadId = getLeadId(lead);

    if (
      rawLeadId === null ||
      rawLeadId === undefined ||
      String(rawLeadId).trim() === ""
    ) {
      console.error(
        "SKYTECH: Lead ID is missing.",
        lead
      );

      return;
    }

    const numericLeadId = Number(rawLeadId);

    if (
      !Number.isInteger(numericLeadId) ||
      numericLeadId <= 0
    ) {
      console.error(
        "SKYTECH: Lead ID must be a valid positive integer.",
        {
          rawLeadId,
          lead,
        }
      );

      return;
    }

    sessionStorage.setItem(
      "selected_lead_id",
      String(numericLeadId)
    );

    navigate(
      `/admin/leads/${numericLeadId}`
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <AdminPortalShell
      activeRoute="/admin/leads"
      title="Lead Management"
      subtitle="SKYTECH Digital Power Platform"
    >
      <div className="space-y-6">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 md:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Administration
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Lead Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage customer enquiries, review
                  requirements and open detailed lead
                  information.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Total Leads
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {loading
                      ? "..."
                      : leads.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadLeads}
                  disabled={loading}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Refreshing..."
                    : "Refresh"}
                </button>

              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to load leads
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={loadLeads}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>

            </div>
          </div>
        )}

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              All Leads
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : leads.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total enquiries received
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Showing
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : filteredLeads.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Matching current filters
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Status Types
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : statuses.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Different lead statuses
            </p>
          </div>

        </section>

        {/* ==================================================
            FILTER BAR
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">
              <label
                htmlFor="lead-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Leads
              </label>

              <input
                id="lead-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by lead ID, customer, company, requirement..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="w-full lg:w-56">
              <label
                htmlFor="lead-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="lead-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">
                  All Statuses
                </option>

                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {normalizeStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            {(search ||
              statusFilter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}

          </div>
        </section>

        {/* ==================================================
            LEADS TABLE
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:p-6">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Customer Enquiries
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Lead Records
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {loading
                ? "Loading..."
                : `${filteredLeads.length} lead${
                    filteredLeads.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

          {loading ? (

            <div className="p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading lead records...
              </p>
            </div>

          ) : filteredLeads.length === 0 ? (

            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📋
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No leads found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or status
                filter.
              </p>

              {(search ||
                statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              )}

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Lead ID
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Company
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Industry
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Requirement
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Assigned To
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredLeads.map(
                    (lead, index) => {

                      const leadId =
                        getLeadId(lead);

                      const leadCode =
                        getLeadCode(lead);

                      const customer =
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

                      const status =
                        lead?.status ?? "new";

                      const assignedTo =
                        lead?.assigned_to ??
                        lead?.assigned_user ??
                        lead?.assigned_admin ??
                        "-";

                      return (
                        <tr
                          key={
                            leadId ??
                            leadCode ??
                            index
                          }
                          onClick={() =>
                            openLead(lead)
                          }
                          className="cursor-pointer transition hover:bg-blue-50/40"
                        >

                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-900">
                              {leadCode}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {customer}
                            </p>

                            {lead?.email && (
                              <p className="mt-1 text-xs text-slate-500">
                                {lead.email}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {company}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {industry}
                          </td>

                          <td className="max-w-[240px] px-5 py-4">
                            <p
                              title={String(
                                requirement
                              )}
                              className="truncate text-sm text-slate-700"
                            >
                              {requirement}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                status
                              )}`}
                            >
                              {normalizeStatus(
                                status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {assignedTo}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              lead?.created_at ??
                                lead?.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">

                            {leadId !== null &&
                            leadId !== undefined ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openLead(lead);
                                }}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No ID
                              </span>
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ==================================================
            FOOT NOTE
        ================================================== */}

        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <span>
            SKYTECH Admin Portal · Lead Management
          </span>

          <Link
            to="/admin"
            className="font-semibold text-slate-700 no-underline hover:text-blue-600"
          >
            ← Back to Dashboard
          </Link>

        </div>

      </div>
    </AdminPortalShell>
  );
}