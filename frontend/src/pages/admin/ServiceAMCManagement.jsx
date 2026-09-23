import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return safeText(value);
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

function normalizeStatus(status) {
  return String(status || "active")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function statusClass(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    [
      "active",
      "approved",
      "completed",
      "renewed",
    ].includes(value)
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "expiring",
      "pending",
      "renewal_pending",
      "due",
    ].includes(value)
  ) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (
    [
      "expired",
      "cancelled",
      "canceled",
      "inactive",
      "terminated",
    ].includes(value)
  ) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-blue-100 bg-blue-50 text-blue-700";
}

function normalizeContracts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.contracts)) {
    return data.contracts;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getContractId(contract) {
  return (
    contract?.id ??
    contract?.contract_id ??
    contract?.amc_id ??
    null
  );
}

function getContractCode(contract) {
  return (
    contract?.contract_code ??
    contract?.amc_code ??
    contract?.code ??
    getContractId(contract) ??
    "-"
  );
}

function getStartDate(contract) {
  return (
    contract?.start_date ??
    contract?.startDate ??
    contract?.valid_from ??
    contract?.from_date
  );
}

function getEndDate(contract) {
  return (
    contract?.end_date ??
    contract?.endDate ??
    contract?.valid_until ??
    contract?.to_date
  );
}

function daysUntil(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.ceil(
    (date.getTime() -
      today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export default function ServiceAMCManagement() {
  const navigate = useNavigate();

  const [contracts, setContracts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const loadContracts = async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await apiFetch(
          "/api/admin/service-amc"
        );

      if (!response.ok) {
        let message =
          `AMC API failed: ${response.status}`;

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
          // Ignore JSON parsing errors.
        }

        throw new Error(message);
      }

      const data =
        await response.json();

      setContracts(
        normalizeContracts(data)
      );
    } catch (err) {
      console.error(
        "AMC Management Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load AMC contracts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const statuses = useMemo(() => {
    const values = contracts
      .map((contract) =>
        String(
          contract?.status || ""
        )
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    return [
      ...new Set(values),
    ].sort();
  }, [contracts]);

  const summary = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let expired = 0;

    contracts.forEach(
      (contract) => {
        const status =
          String(
            contract?.status || ""
          )
            .trim()
            .toLowerCase();

        if (
          [
            "active",
            "approved",
            "renewed",
          ].includes(status)
        ) {
          active += 1;
        }

        const remainingDays =
          daysUntil(
            getEndDate(contract)
          );

        if (
          remainingDays !== null &&
          remainingDays >= 0 &&
          remainingDays <= 30
        ) {
          expiring += 1;
        }

        if (
          status === "expired" ||
          (remainingDays !== null &&
            remainingDays < 0)
        ) {
          expired += 1;
        }
      }
    );

    return {
      total: contracts.length,
      active,
      expiring,
      expired,
    };
  }, [contracts]);

  const filteredContracts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return contracts.filter(
        (contract) => {
          const status =
            String(
              contract?.status || ""
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
            contract?.id,
            contract?.contract_id,
            contract?.amc_id,
            contract?.contract_code,
            contract?.amc_code,
            contract?.code,
            contract?.customer_name,
            contract?.customer,
            contract?.company,
            contract?.status,
            contract?.amount,
            contract?.total_amount,
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
      contracts,
      search,
      statusFilter,
    ]);

  const openContract = (
    contract
  ) => {
    const contractId =
      getContractId(contract);

    if (
      contractId === null ||
      contractId === undefined ||
      String(contractId).trim() === ""
    ) {
      console.warn(
        "SKYTECH: AMC contract does not contain an ID:",
        contract
      );

      return;
    }

    sessionStorage.setItem(
      "selected_amc_id",
      String(contractId)
    );

    sessionStorage.setItem(
      "selected_amc_detail",
      JSON.stringify(contract)
    );

    /*
     * Existing architecture keeps
     * Service & AMC as the management/detail
     * route.
     */
    navigate(
      "/admin/service-amc"
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <AdminPortalShell
      activeRoute="/admin/service-amc"
      title="Service & AMC"
      subtitle="SKYTECH Digital Power Platform"
    >
      <div className="space-y-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="p-5 md:p-6">

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Service Operations
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Service Requests & AMC
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Monitor annual maintenance contracts,
                  contract validity, customer coverage and
                  upcoming AMC renewals.
                </p>

              </div>

              <button
                type="button"
                onClick={loadContracts}
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

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-semibold text-red-800">
                  Unable to load AMC contracts
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={loadContracts}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>

            </div>

          </div>
        )}

        {/* ==================================================
            KPI CARDS
        ================================================== */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total AMC
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : summary.total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                AMC
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-500">
              All maintenance contracts
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Active AMC
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : summary.active}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                ✓
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-500">
              Currently active contracts
            </p>

          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Expiring &lt;30d
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : summary.expiring}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                !
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-500">
              Contracts requiring attention
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Expired
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : summary.expired}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                !
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-500">
              Contracts past their end date
            </p>

          </div>

        </section>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">

              <label
                htmlFor="amc-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search AMC
              </label>

              <input
                id="amc-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search contract, customer, company..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            <div className="w-full lg:w-56">

              <label
                htmlFor="amc-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="amc-status"
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
            AMC TABLE
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:p-6">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Contract Register
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                AMC Contracts
              </h2>

            </div>

            <p className="text-sm text-slate-500">
              {loading
                ? "Loading..."
                : `${filteredContracts.length} contract${
                    filteredContracts.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

          {loading ? (

            <div className="p-12 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading AMC contracts...
              </p>

            </div>

          ) : filteredContracts.length === 0 ? (

            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500">
                AMC
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No AMC contracts found
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

              <table className="w-full min-w-[1100px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Contract
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Company
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Start
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      End
                    </th>

                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredContracts.map(
                    (
                      contract,
                      index
                    ) => {

                      const contractId =
                        getContractId(
                          contract
                        );

                      const contractCode =
                        getContractCode(
                          contract
                        );

                      const customer =
                        contract?.customer_name ??
                        contract?.customer ??
                        "-";

                      const company =
                        contract?.company ??
                        "-";

                      const amount =
                        contract?.amount ??
                        contract?.total_amount ??
                        contract?.total;

                      const status =
                        contract?.status ??
                        "active";

                      const startDate =
                        getStartDate(
                          contract
                        );

                      const endDate =
                        getEndDate(
                          contract
                        );

                      const remaining =
                        daysUntil(
                          endDate
                        );

                      return (
                        <tr
                          key={
                            contractId ??
                            contractCode ??
                            index
                          }
                          onClick={() =>
                            openContract(
                              contract
                            )
                          }
                          className="cursor-pointer transition hover:bg-blue-50/40"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-900">
                              {safeText(
                                contractCode
                              )}
                            </p>

                            {contractId !==
                              null &&
                              contractId !==
                                undefined && (
                                <p className="mt-1 text-xs text-slate-400">
                                  ID:{" "}
                                  {contractId}
                                </p>
                              )}

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium text-slate-800">
                              {safeText(
                                customer
                              )}
                            </p>

                            {contract?.email && (
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  contract.email
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {safeText(
                              company
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-900">
                              {formatCurrency(
                                amount
                              )}
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex flex-col items-start gap-1">

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  status
                                )}`}
                              >
                                {normalizeStatus(
                                  status
                                )}
                              </span>

                              {remaining !==
                                null &&
                                remaining >=
                                  0 &&
                                remaining <=
                                  30 && (
                                  <span className="text-[11px] font-medium text-amber-600">
                                    {remaining ===
                                    0
                                      ? "Expires today"
                                      : `${remaining} days left`}
                                  </span>
                                )}

                              {remaining !==
                                null &&
                                remaining < 0 && (
                                  <span className="text-[11px] font-medium text-slate-500">
                                    Expired
                                  </span>
                                )}

                            </div>

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              startDate
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              endDate
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">

                            {contractId !==
                            null &&
                            contractId !==
                              undefined ? (
                              <button
                                type="button"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  openContract(
                                    contract
                                  );
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
            FOOTER
        ================================================== */}

        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <span>
            SKYTECH Admin Portal · Service & AMC
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