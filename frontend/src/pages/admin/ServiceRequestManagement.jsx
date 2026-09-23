import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminPortalShell from "../../layouts/AdminPortalShell";
import { apiFetch } from "../../utils/api";

function safeText(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  return String(value);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function normalizeStatus(value) {
  return String(value || "open")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function statusClass(value) {
  const status = String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    [
      "completed",
      "closed",
      "resolved",
      "approved",
    ].includes(status)
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "in_progress",
      "assigned",
      "processing",
      "under_review",
    ].includes(status)
  ) {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (
    [
      "pending",
      "open",
      "new",
      "requested",
    ].includes(status)
  ) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (
    [
      "cancelled",
      "canceled",
      "rejected",
    ].includes(status)
  ) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function priorityClass(value) {
  const priority = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    priority === "critical" ||
    priority === "urgent"
  ) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "border-orange-100 bg-orange-50 text-orange-700";
  }

  if (priority === "medium") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function normalizeRequests(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.requests)) {
    return data.requests;
  }

  if (Array.isArray(data?.service_requests)) {
    return data.service_requests;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getRequestId(request) {
  return (
    request?.id ??
    request?.request_id ??
    request?.service_request_id ??
    null
  );
}

export default function ServiceRequestManagement() {
  const [requests, setRequests] =
    useState([]);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [priorityFilter, setPriorityFilter] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const pageSize = 10;

  const [loading, setLoading] =
    useState(true);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showDetails, setShowDetails] =
    useState(false);

  const [editStatus, setEditStatus] =
    useState("");

  const [editPriority, setEditPriority] =
    useState("");

  const [editAssignedTo, setEditAssignedTo] =
    useState("");

  const loadRequests = async (
    targetPage = page
  ) => {
    setLoading(true);
    setError("");

    try {
      const response =
        await apiFetch(
          "/api/admin/service-requests"
        );

      if (!response.ok) {
        let message =
          `Service Request API failed: ${response.status}`;

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
          // Ignore JSON errors.
        }

        throw new Error(message);
      }

      const data =
        await response.json();

      setRequests(
        normalizeRequests(data)
      );
    } catch (err) {
      console.error(
        "Service Request Loading Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load service requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
  }, []);

  const statuses = useMemo(() => {
    return [
      ...new Set(
        requests
          .map((item) =>
            String(
              item?.status || ""
            )
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [requests]);

  const priorities = useMemo(() => {
    return [
      ...new Set(
        requests
          .map((item) =>
            String(
              item?.priority || ""
            )
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [requests]);

  const filteredRequests =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          const requestStatus =
            String(
              request?.status || ""
            )
              .trim()
              .toLowerCase();

          const requestPriority =
            String(
              request?.priority || ""
            )
              .trim()
              .toLowerCase();

          if (
            statusFilter !== "all" &&
            requestStatus !==
              statusFilter
          ) {
            return false;
          }

          if (
            priorityFilter !== "all" &&
            requestPriority !==
              priorityFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable = [
            request?.id,
            request?.request_id,
            request?.service_request_id,
            request?.customer_name,
            request?.customer,
            request?.company,
            request?.email,
            request?.issue,
            request?.description,
            request?.request_type,
            request?.equipment,
            request?.equipment_type,
            request?.serial_number,
            request?.status,
            request?.priority,
            request?.assigned_to,
          ]
            .filter(
              (value) =>
                value !== null &&
                value !== undefined
            )
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      requests,
      search,
      statusFilter,
      priorityFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length /
        pageSize
    )
  );

  const currentPage =
    Math.min(
      page,
      totalPages
    );

  const paginatedRequests =
    filteredRequests.slice(
      (currentPage - 1) *
        pageSize,
      currentPage *
        pageSize
    );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
  ]);

  const summary = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let critical = 0;
    let completed = 0;

    requests.forEach(
      (request) => {
        const status =
          String(
            request?.status || ""
          )
            .trim()
            .toLowerCase()
            .replaceAll("-", "_")
            .replaceAll(" ", "_");

        const priority =
          String(
            request?.priority || ""
          )
            .trim()
            .toLowerCase();

        if (
          [
            "open",
            "new",
            "pending",
            "requested",
          ].includes(status)
        ) {
          open += 1;
        }

        if (
          [
            "in_progress",
            "assigned",
            "processing",
          ].includes(status)
        ) {
          inProgress += 1;
        }

        if (
          [
            "critical",
            "urgent",
          ].includes(priority)
        ) {
          critical += 1;
        }

        if (
          [
            "completed",
            "closed",
            "resolved",
          ].includes(status)
        ) {
          completed += 1;
        }
      }
    );

    return {
      total: requests.length,
      open,
      inProgress,
      critical,
      completed,
    };
  }, [requests]);

  const openDetails = async (
    request
  ) => {
    const requestId =
      getRequestId(request);

    if (!requestId) {
      setSelectedRequest(
        request
      );

      setEditStatus(
        request?.status || ""
      );

      setEditPriority(
        request?.priority || ""
      );

      setEditAssignedTo(
        request?.assigned_to || ""
      );

      setShowDetails(true);

      return;
    }

    setDetailsLoading(true);
    setError("");

    try {
      const response =
        await apiFetch(
          `/api/admin/service-requests/${requestId}`
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to load request details (${response.status}).`
        );
      }

      const detail =
        data?.service_request ??
        data?.request ??
        data;

      setSelectedRequest(
        detail
      );

      setEditStatus(
        detail?.status || ""
      );

      setEditPriority(
        detail?.priority || ""
      );

      setEditAssignedTo(
        detail?.assigned_to || ""
      );

      sessionStorage.setItem(
        "selected_service_request_id",
        String(requestId)
      );

      sessionStorage.setItem(
        "selected_service_request_detail",
        JSON.stringify(detail)
      );

      setShowDetails(true);
    } catch (err) {
      console.error(
        "Service Request Detail Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load request details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateRequest = async () => {
    if (!selectedRequest) {
      return;
    }

    const requestId =
      getRequestId(
        selectedRequest
      );

    if (!requestId) {
      setError(
        "Service request ID is missing."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await apiFetch(
          `/api/admin/service-requests/${requestId}`,
          {
            method: "PUT",
            body: {
              status:
                editStatus ||
                null,
              priority:
                editPriority ||
                null,
              assigned_to:
                editAssignedTo.trim() ||
                null,
            },
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to update service request."
        );
      }

      const returnedRequest =
        data?.service_request ??
        data?.request ??
        data;

      const updatedRequest = {
        ...selectedRequest,
        ...(returnedRequest &&
        typeof returnedRequest ===
          "object"
          ? returnedRequest
          : {}),
        status: editStatus,
        priority: editPriority,
        assigned_to:
          editAssignedTo.trim() ||
          null,
      };

      setSelectedRequest(
        updatedRequest
      );

      sessionStorage.setItem(
        "selected_service_request_detail",
        JSON.stringify(
          updatedRequest
        )
      );

      await loadRequests(
        currentPage
      );

      setError("");

      window.alert(
        data?.message ||
          "Service request updated successfully."
      );
    } catch (err) {
      console.error(
        "Update Service Request Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update service request."
      );
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setPage(1);
  };

  return (
    <AdminPortalShell
      activeRoute="/admin/service-requests"
      title="Service Requests"
      subtitle="SKYTECH Digital Power Platform"
    >
      <div className="space-y-6">

        {/* HEADER */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 md:p-6">

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Service Operations
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Service Request Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Monitor customer service requests,
                  priorities, assignments and resolution
                  status.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadRequests(
                    currentPage
                  )
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
              Service Request Error
            </p>

            <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* KPI */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.total}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              All service requests
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Open
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.open}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Awaiting action
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.inProgress}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Currently assigned
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Critical
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.critical}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Urgent priority requests
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.completed}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Resolved requests
            </p>
          </div>

        </section>

        {/* FILTERS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">

            <div>
              <label
                htmlFor="service-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Requests
              </label>

              <input
                id="service-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(1);
                }}
                placeholder="Search customer, company, issue, equipment..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="service-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="service-status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">
                  All Statuses
                </option>

                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {normalizeStatus(
                        status
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="service-priority"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Priority
              </label>

              <select
                id="service-priority"
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">
                  All Priorities
                </option>

                {priorities.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {normalizeStatus(
                        priority
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            {(search ||
              statusFilter !==
                "all" ||
              priorityFilter !==
                "all") && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            )}

          </div>

        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:p-6">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Technical Support
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Service Requests
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {loading
                ? "Loading..."
                : `${filteredRequests.length} request${
                    filteredRequests.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

          {loading ? (
            <div className="p-12 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading service requests...
              </p>

            </div>
          ) : paginatedRequests.length ===
            0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                SR
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No service requests found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or
                filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Request
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Issue
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Priority
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

                  {paginatedRequests.map(
                    (
                      request,
                      index
                    ) => {
                      const requestId =
                        getRequestId(
                          request
                        );

                      const customer =
                        request?.customer_name ??
                        request?.customer ??
                        "-";

                      const company =
                        request?.company ??
                        "-";

                      const issue =
                        request?.issue ??
                        request?.description ??
                        request?.request_type ??
                        "-";

                      const priority =
                        request?.priority ??
                        "medium";

                      const status =
                        request?.status ??
                        "open";

                      const assignedTo =
                        request?.assigned_to ??
                        "-";

                      const createdAt =
                        request?.created_at ??
                        request?.createdAt ??
                        request?.date;

                      return (
                        <tr
                          key={
                            requestId ??
                            index
                          }
                          onClick={() =>
                            openDetails(
                              request
                            )
                          }
                          className="cursor-pointer transition hover:bg-blue-50/40"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-900">
                              {requestId
                                ? `SR-${requestId}`
                                : "-"}
                            </p>

                            {request?.request_type && (
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  request.request_type
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium text-slate-800">
                              {safeText(
                                customer
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {safeText(
                                company
                              )}
                            </p>

                          </td>

                          <td className="max-w-[250px] px-5 py-4">

                            <p
                              title={String(
                                issue
                              )}
                              className="truncate text-sm text-slate-700"
                            >
                              {safeText(
                                issue
                              )}
                            </p>

                            {request?.equipment && (
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {
                                  request.equipment
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass(
                                priority
                              )}`}
                            >
                              {normalizeStatus(
                                priority
                              )}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                status
                              )}`}
                            >
                              {normalizeStatus(
                                status
                              )}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {safeText(
                              assignedTo
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              createdAt
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">

                            <button
                              type="button"
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                openDetails(
                                  request
                                );
                              }}
                              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                            >
                              View
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

          {/* PAGINATION */}

          {!loading &&
            filteredRequests.length >
              0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-700">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {totalPages}
                  </span>
                </p>

                <div className="flex gap-2">

                  <button
                    type="button"
                    disabled={
                      currentPage <=
                      1
                    }
                    onClick={() =>
                      setPage(
                        (value) =>
                          Math.max(
                            1,
                            value - 1
                          )
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      currentPage >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (value) =>
                          Math.min(
                            totalPages,
                            value + 1
                          )
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>

                </div>

              </div>
            )}

        </section>

        {/* DETAIL MODAL */}

        {showDetails && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowDetails(
                  false
                );
              }
            }}
          >

            <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-6">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                    Service Request
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Request #
                    {getRequestId(
                      selectedRequest
                    ) ?? "-"}
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetails(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                >
                  ×
                </button>

              </div>

              {/* MODAL CONTENT */}

              <div className="max-h-[calc(92vh-145px)] overflow-y-auto p-5 md:p-6">

                {detailsLoading ? (
                  <div className="p-12 text-center">

                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading request details...
                    </p>

                  </div>
                ) : selectedRequest ? (
                  <div className="space-y-6">

                    {/* INFO */}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Customer
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {safeText(
                            selectedRequest?.customer_name ??
                              selectedRequest?.customer
                          )}
                        </p>

                        {selectedRequest?.email && (
                          <p className="mt-1 text-sm text-slate-500">
                            {
                              selectedRequest.email
                            }
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Company
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {safeText(
                            selectedRequest?.company
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Request Type
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {safeText(
                            selectedRequest?.request_type
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Equipment
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {safeText(
                            selectedRequest?.equipment ??
                              selectedRequest?.equipment_type
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Serial Number
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {safeText(
                            selectedRequest?.serial_number
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Created
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {formatDateTime(
                            selectedRequest?.created_at ??
                              selectedRequest?.createdAt
                          )}
                        </p>
                      </div>

                    </div>

                    {/* ISSUE */}

                    <div className="rounded-xl border border-slate-200 bg-white p-5">

                      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                        Issue / Description
                      </p>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {safeText(
                          selectedRequest?.issue ??
                            selectedRequest?.description ??
                            selectedRequest?.message
                        )}
                      </p>

                    </div>

                    {/* EDIT */}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                      <div className="mb-5">

                        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                          Request Control
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-900">
                          Update Request
                        </h3>

                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div>

                          <label
                            htmlFor="edit-service-status"
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Status
                          </label>

                          <select
                            id="edit-service-status"
                            value={
                              editStatus
                            }
                            onChange={(
                              event
                            ) =>
                              setEditStatus(
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >

                            <option value="">
                              Select Status
                            </option>

                            <option value="open">
                              Open
                            </option>

                            <option value="pending">
                              Pending
                            </option>

                            <option value="assigned">
                              Assigned
                            </option>

                            <option value="in_progress">
                              In Progress
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="resolved">
                              Resolved
                            </option>

                            <option value="closed">
                              Closed
                            </option>

                            <option value="cancelled">
                              Cancelled
                            </option>

                          </select>

                        </div>

                        <div>

                          <label
                            htmlFor="edit-service-priority"
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Priority
                          </label>

                          <select
                            id="edit-service-priority"
                            value={
                              editPriority
                            }
                            onChange={(
                              event
                            ) =>
                              setEditPriority(
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >

                            <option value="">
                              Select Priority
                            </option>

                            <option value="low">
                              Low
                            </option>

                            <option value="medium">
                              Medium
                            </option>

                            <option value="high">
                              High
                            </option>

                            <option value="critical">
                              Critical
                            </option>

                            <option value="urgent">
                              Urgent
                            </option>

                          </select>

                        </div>

                        <div>

                          <label
                            htmlFor="edit-service-assigned"
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Assigned To
                          </label>

                          <input
                            id="edit-service-assigned"
                            type="text"
                            value={
                              editAssignedTo
                            }
                            onChange={(
                              event
                            ) =>
                              setEditAssignedTo(
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Engineer / team"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />

                        </div>

                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            setShowDetails(
                              false
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                          Close
                        </button>

                        <button
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={
                            updateRequest
                          }
                          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving
                            ? "Saving..."
                            : "Save Changes"}
                        </button>

                      </div>

                    </div>

                  </div>
                ) : null}

              </div>

            </div>

          </div>
        )}

      </div>
    </AdminPortalShell>
  );
}