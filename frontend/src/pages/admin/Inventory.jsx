import { useEffect, useMemo, useState } from "react";

import AdminPortalShell from "../../layouts/AdminPortalShell";
import { apiFetch } from "../../utils/api";

const PAGE_SIZE = 10;

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

function statusClass(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    [
      "active",
      "installed",
      "operational",
    ].includes(value)
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "inactive",
      "retired",
      "cancelled",
      "canceled",
    ].includes(value)
  ) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (
    [
      "maintenance",
      "service",
      "pending",
    ].includes(value)
  ) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border-blue-100 bg-blue-50 text-blue-700";
}

function normalizeStatus(status) {
  return String(status || "unknown")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

export default function Inventory() {
  const [equipment, setEquipment] =
    useState([]);

  const [summary, setSummary] =
    useState({
      total: 0,
      active: 0,
      inactive: 0,
      maintenance: 0,
    });

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [type, setType] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadInventory = async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await apiFetch(
          "/api/admin/inventory"
        );

      if (!response.ok) {
        let message =
          `Inventory API failed: ${response.status}`;

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

        throw new Error(message);
      }

      const data =
        await response.json();

      setEquipment(
        Array.isArray(
          data?.equipment
        )
          ? data.equipment
          : []
      );

      setSummary({
        total: Number(
          data?.summary?.total ??
            0
        ),
        active: Number(
          data?.summary?.active ??
            0
        ),
        inactive: Number(
          data?.summary?.inactive ??
            0
        ),
        maintenance: Number(
          data?.summary?.maintenance ??
            0
        ),
      });
    } catch (err) {
      console.error(
        "Inventory loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const equipmentTypes =
    useMemo(() => {
      const values =
        equipment
          .map(
            (item) =>
              item?.equipment_type ||
              item?.type ||
              item?.category
          )
          .filter(Boolean)
          .map(String);

      return [
        ...new Set(values),
      ].sort((a, b) =>
        a.localeCompare(b)
      );
    }, [equipment]);

  const filteredEquipment =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return equipment.filter(
        (item) => {
          const itemStatus =
            String(
              item?.status || ""
            ).toLowerCase();

          const itemType =
            String(
              item?.equipment_type ||
                item?.type ||
                item?.category ||
                ""
            ).toLowerCase();

          const matchesStatus =
            status === "all" ||
            itemStatus ===
              status.toLowerCase();

          const matchesType =
            type === "all" ||
            itemType ===
              type.toLowerCase();

          const searchableText = [
            item?.customer_name,
            item?.customer_email,
            item?.company,
            item?.equipment_type,
            item?.type,
            item?.category,
            item?.model,
            item?.model_number,
            item?.serial_number,
            item?.location,
            item?.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );

          return (
            matchesStatus &&
            matchesType &&
            matchesSearch
          );
        }
      );
    }, [
      equipment,
      search,
      status,
      type,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEquipment.length /
          PAGE_SIZE
      )
    );

  const currentPage =
    Math.min(
      page,
      totalPages
    );

  const visibleEquipment =
    filteredEquipment.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage *
        PAGE_SIZE
    );

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setType("all");
    setPage(1);
  };

  return (
    <AdminPortalShell
      activeRoute="/admin/inventory"
      title="Inventory"
      subtitle="SKYTECH Digital Power Platform"
    >
      <div className="space-y-6">

        {/* HEADER */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="p-5 md:p-6">

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Asset Operations
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Equipment Inventory
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Monitor registered SKYTECH equipment,
                  customer assignments, operational status
                  and maintenance state.
                </p>

              </div>

              <button
                type="button"
                onClick={loadInventory}
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
              Unable to load inventory
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* KPI */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Equipment
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.total}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Registered assets
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.active}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Operational equipment
            </p>

          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Maintenance
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.maintenance}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Requiring service
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Inactive
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : summary.inactive}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Inactive or retired
            </p>

          </div>

        </section>

        {/* FILTERS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_240px_auto] lg:items-end">

            <div>

              <label
                htmlFor="inventory-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Equipment
              </label>

              <input
                id="inventory-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(1);
                }}
                placeholder="Search customer, model, serial number, location..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            <div>

              <label
                htmlFor="inventory-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="inventory-status"
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="all">
                  All Statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="installed">
                  Installed
                </option>

                <option value="operational">
                  Operational
                </option>

                <option value="retired">
                  Retired
                </option>

                <option value="pending">
                  Pending
                </option>

              </select>

            </div>

            <div>

              <label
                htmlFor="inventory-type"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Equipment Type
              </label>

              <select
                id="inventory-type"
                value={type}
                onChange={(event) => {
                  setType(
                    event.target.value
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="all">
                  All Equipment Types
                </option>

                {equipmentTypes.map(
                  (equipmentType) => (
                    <option
                      key={equipmentType}
                      value={equipmentType}
                    >
                      {equipmentType}
                    </option>
                  )
                )}

              </select>

            </div>

            {(search ||
              status !== "all" ||
              type !== "all") && (
              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}

          </div>

        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:p-6">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Asset Register
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Equipment Records
              </h2>

            </div>

            <p className="text-sm text-slate-500">
              {loading
                ? "Loading..."
                : `${filteredEquipment.length} equipment record${
                    filteredEquipment.length ===
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
                Loading inventory...
              </p>

            </div>

          ) : visibleEquipment.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500">
                EQ
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No equipment found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

              {(search ||
                status !== "all" ||
                type !== "all") && (
                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              )}

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Equipment
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Model
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Serial Number
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Location
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Installed
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {visibleEquipment.map(
                    (
                      item,
                      index
                    ) => {

                      const equipmentType =
                        item?.equipment_type ||
                        item?.type ||
                        item?.category;

                      const model =
                        item?.model ||
                        item?.model_number;

                      const serial =
                        item?.serial_number ||
                        item?.serial ||
                        item?.serial_no;

                      const installedDate =
                        item?.installation_date ||
                        item?.installed_at ||
                        item?.installed_date;

                      return (
                        <tr
                          key={
                            item?.id ??
                            item?.equipment_id ??
                            serial ??
                            index
                          }
                          className="transition hover:bg-blue-50/40"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-800">
                              {safeText(
                                item?.customer_name
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {safeText(
                                item?.company
                              )}
                            </p>

                            {item?.customer_email && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  item.customer_email
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium text-slate-900">
                              {safeText(
                                equipmentType
                              )}
                            </p>

                            {item?.category &&
                              item.category !==
                                equipmentType && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    item.category
                                  }
                                </p>
                              )}

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {safeText(
                              model
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <span className="font-mono text-sm text-slate-700">
                              {safeText(
                                serial
                              )}
                            </span>

                          </td>

                          <td className="max-w-[220px] px-5 py-4">

                            <p
                              title={String(
                                item?.location ||
                                  "-"
                              )}
                              className="truncate text-sm text-slate-700"
                            >
                              {safeText(
                                item?.location
                              )}
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                item?.status
                              )}`}
                            >
                              {normalizeStatus(
                                item?.status
                              )}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              installedDate
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

          {/* PAGINATION */}

          {!loading &&
            filteredEquipment.length >
              0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">

                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(currentPage -
                      1) *
                      PAGE_SIZE +
                      1}
                  </span>{" "}
                  –{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      currentPage *
                        PAGE_SIZE,
                      filteredEquipment.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredEquipment.length}
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
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="flex items-center px-2 text-sm font-semibold text-slate-600">
                    {currentPage} /{" "}
                    {totalPages}
                  </span>

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
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>

                </div>

              </div>
            )}

        </section>

        {/* FOOTER */}

        <div className="text-xs text-slate-500">
          SKYTECH Admin Portal · Equipment Inventory
        </div>

      </div>
    </AdminPortalShell>
  );
}