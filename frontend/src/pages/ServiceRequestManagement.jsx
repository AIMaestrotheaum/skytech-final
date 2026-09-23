import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";

export default function ServiceRequestManagement() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // =========================
  // LOAD SERVICE REQUESTS
  // =========================
  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        "/api/admin/service-requests"
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || "Failed to load service requests."
        );
      }

      const data = await response.json();

      const rows = Array.isArray(data)
        ? data
        : data.requests || data.items || [];

      setRequests(rows);
    } catch (err) {
      setError(err.message || "Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  // =========================
  // LOAD REQUEST DETAIL
  // =========================
  async function openRequest(requestId) {
    try {
      setDetailLoading(true);
      setError("");
      setMessage("");

      const response = await apiFetch(
        `/api/admin/service-requests/${requestId}`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || "Failed to load service request."
        );
      }

      const data = await response.json();

      setSelectedRequest(data);

      setStatus(data.status || "");
      setPriority(data.priority || "");
      setAssignedTo(data.assigned_to || "");

      sessionStorage.setItem(
        "selected_service_request_id",
        String(requestId)
      );
    } catch (err) {
      setError(
        err.message || "Failed to load service request."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // =========================
  // UPDATE REQUEST
  // =========================
  async function updateRequest() {
    if (!selectedRequest?.id) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await apiFetch(
        `/api/admin/service-requests/${selectedRequest.id}`,
        {
          method: "PUT",
          body: {
            status,
            priority,
            assigned_to: assignedTo || null,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || "Failed to update service request."
        );
      }

      const updated = await response.json();

      setSelectedRequest(updated);

      setStatus(updated.status || "");
      setPriority(updated.priority || "");
      setAssignedTo(updated.assigned_to || "");

      setMessage("Service request updated successfully.");

      await loadRequests();
    } catch (err) {
      setError(
        err.message || "Failed to update service request."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // FILTER
  // =========================
  const filteredRequests = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !searchText ||
        String(request.request_code || "")
          .toLowerCase()
          .includes(searchText) ||
        String(request.customer_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(request.company || "")
          .toLowerCase()
          .includes(searchText) ||
        String(request.issue || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        String(request.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === "all" ||
        String(request.priority || "").toLowerCase() ===
          priorityFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    priorityFilter,
  ]);

  // =========================
  // PAGINATION
  // =========================
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter]);

  // =========================
  // HELPERS
  // =========================
  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function statusClass(value) {
    const normalized = String(value || "").toLowerCase();

    if (normalized === "open") {
      return "bg-blue-100 text-blue-700";
    }

    if (normalized === "in_progress") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (normalized === "resolved") {
      return "bg-green-100 text-green-700";
    }

    if (normalized === "closed") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  function priorityClass(value) {
    const normalized = String(value || "").toLowerCase();

    if (normalized === "critical") {
      return "bg-red-100 text-red-700";
    }

    if (normalized === "high") {
      return "bg-orange-100 text-orange-700";
    }

    if (normalized === "normal") {
      return "bg-blue-100 text-blue-700";
    }

    if (normalized === "low") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#1d1d20]">
      {/* Header */}
      <header className="border-b border-[#c5c6cd] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#0050cc]">
              SKYTECH ELECTRICALS
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Service Request Management
            </h1>
          </div>

          <button
            onClick={loadRequests}
            className="rounded-lg border border-[#c5c6cd] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#f2f4f6]"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-16">
        {/* Alerts */}
        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <section className="mb-6 rounded-xl border border-[#c5c6cd] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search request code, customer, company or issue..."
              className="rounded-lg border border-[#c5c6cd] px-4 py-3 text-sm outline-none focus:border-[#0050cc]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#c5c6cd] px-4 py-3 text-sm outline-none focus:border-[#0050cc]"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">
                In Progress
              </option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value)
              }
              className="rounded-lg border border-[#c5c6cd] px-4 py-3 text-sm outline-none focus:border-[#0050cc]"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </section>

        {/* Main layout */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Table */}
          <section className="overflow-hidden rounded-xl border border-[#c5c6cd] bg-white">
            <div className="border-b border-[#c5c6cd] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Service Requests
                  </h2>

                  <p className="mt-1 text-sm text-[#44474d]">
                    {filteredRequests.length} request
                    {filteredRequests.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-[#44474d]">
                Loading service requests...
              </div>
            ) : paginatedRequests.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[#44474d]">
                No service requests found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-[#f2f4f6]">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                        Request
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                        Issue
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                        Priority
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                        Created
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e4e5e9]">
                    {paginatedRequests.map((request) => (
                      <tr
                        key={request.id}
                        className={`transition hover:bg-[#f7f9fb] ${
                          selectedRequest?.id === request.id
                            ? "bg-[#f2f6ff]"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-mono text-sm font-semibold">
                            {request.request_code ||
                              `SR-${request.id}`}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium">
                            {request.customer_name ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-[#44474d]">
                            {request.company || "—"}
                          </div>
                        </td>

                        <td className="max-w-[220px] px-5 py-4">
                          <div className="truncate text-sm">
                            {request.issue || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                              request.priority
                            )}`}
                          >
                            {request.priority ||
                              "normal"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                              request.status
                            )}`}
                          >
                            {String(
                              request.status ||
                                "open"
                            ).replace(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#44474d]">
                          {formatDate(
                            request.created_at
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() =>
                              openRequest(request.id)
                            }
                            className="rounded-lg bg-[#0050cc] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#003f9f]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading &&
              filteredRequests.length > 0 && (
                <div className="flex items-center justify-between border-t border-[#c5c6cd] px-5 py-4">
                  <p className="text-sm text-[#44474d]">
                    Page {currentPage} of {totalPages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setPage((p) => Math.max(1, p - 1))
                      }
                      className="rounded-lg border border-[#c5c6cd] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                      className="rounded-lg border border-[#c5c6cd] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </section>

          {/* Detail / Edit panel */}
          <aside className="rounded-xl border border-[#c5c6cd] bg-white">
            <div className="border-b border-[#c5c6cd] px-5 py-4">
              <h2 className="font-semibold">
                Request Details
              </h2>
            </div>

            {!selectedRequest ? (
              <div className="px-5 py-12 text-center text-sm text-[#44474d]">
                Select a service request to view and
                update its details.
              </div>
            ) : detailLoading ? (
              <div className="px-5 py-12 text-center text-sm text-[#44474d]">
                Loading request...
              </div>
            ) : (
              <div className="space-y-5 p-5">
                {/* Request information */}
                <div>
                  <p className="font-mono text-xs uppercase tracking-wide text-[#0050cc]">
                    {selectedRequest.request_code ||
                      `SR-${selectedRequest.id}`}
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    {selectedRequest.issue ||
                      "Service Request"}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#44474d]">
                      Customer
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedRequest.customer_name ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#44474d]">
                      Company
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedRequest.company || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#44474d]">
                      Created
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(
                        selectedRequest.created_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#44474d]">
                      Request ID
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold">
                      #{selectedRequest.id}
                    </p>
                  </div>
                </div>

                {/* Update */}
                <div className="border-t border-[#e4e5e9] pt-5">
                  <h3 className="font-semibold">
                    Update Request
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Status
                      </label>

                      <select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value)
                        }
                        className="w-full rounded-lg border border-[#c5c6cd] px-3 py-3 text-sm outline-none focus:border-[#0050cc]"
                      >
                        <option value="open">
                          Open
                        </option>
                        <option value="in_progress">
                          In Progress
                        </option>
                        <option value="resolved">
                          Resolved
                        </option>
                        <option value="closed">
                          Closed
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Priority
                      </label>

                      <select
                        value={priority}
                        onChange={(e) =>
                          setPriority(e.target.value)
                        }
                        className="w-full rounded-lg border border-[#c5c6cd] px-3 py-3 text-sm outline-none focus:border-[#0050cc]"
                      >
                        <option value="critical">
                          Critical
                        </option>
                        <option value="high">
                          High
                        </option>
                        <option value="normal">
                          Normal
                        </option>
                        <option value="low">
                          Low
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Assigned Engineer
                      </label>

                      <input
                        type="text"
                        value={assignedTo}
                        onChange={(e) =>
                          setAssignedTo(e.target.value)
                        }
                        placeholder="Enter engineer name"
                        className="w-full rounded-lg border border-[#c5c6cd] px-3 py-3 text-sm outline-none focus:border-[#0050cc]"
                      />
                    </div>

                    <button
                      onClick={updateRequest}
                      disabled={saving}
                      className="w-full rounded-lg bg-[#0050cc] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003f9f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}