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

function normalizeQuotes(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.quotes)) {
    return data.quotes;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getQuoteId(quote) {
  return (
    quote?.id ??
    quote?.quote_id ??
    quote?.quoteId ??
    null
  );
}

function getQuoteCode(quote) {
  return (
    quote?.quote_code ??
    quote?.quote_number ??
    quote?.code ??
    getQuoteId(quote) ??
    "-"
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
      "approved",
      "accepted",
      "converted",
      "completed",
      "closed_won",
    ].includes(value)
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (
    [
      "sent",
      "issued",
      "in_progress",
      "processing",
    ].includes(value)
  ) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (
    [
      "pending",
      "draft",
      "open",
      "new",
    ].includes(value)
  ) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (
    [
      "rejected",
      "cancelled",
      "canceled",
      "expired",
      "closed",
    ].includes(value)
  ) {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function normalizeStatus(status) {
  return String(status || "pending")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function QuoteManagement() {
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const loadQuotes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        "/api/admin/quotes"
      );

      if (!response.ok) {
        let message = `Unable to load quotations (${response.status})`;

        try {
          const errorData =
            await response.json();

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

      setQuotes(normalizeQuotes(data));
    } catch (err) {
      console.error(
        "Quote Management Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load quotations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const statuses = useMemo(() => {
    const values = quotes
      .map((quote) =>
        String(quote?.status || "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    return [...new Set(values)];
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return quotes.filter((quote) => {
      const status =
        String(quote?.status || "")
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
        quote?.id,
        quote?.quote_id,
        quote?.quote_code,
        quote?.quote_number,
        quote?.code,
        quote?.customer_name,
        quote?.customer,
        quote?.company,
        quote?.requirement,
        quote?.requirements,
        quote?.status,
        quote?.amount,
        quote?.total,
        quote?.total_amount,
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
    quotes,
    search,
    statusFilter,
  ]);

  const totalAmount = useMemo(() => {
    return filteredQuotes.reduce(
      (sum, quote) => {
        const amount =
          quote?.total_amount ??
          quote?.total ??
          quote?.amount;

        const numericAmount =
          Number(amount);

        if (
          Number.isNaN(numericAmount)
        ) {
          return sum;
        }

        return sum + numericAmount;
      },
      0
    );
  }, [filteredQuotes]);

  /*
   * ------------------------------------------------------------
   * Open quotation
   * ------------------------------------------------------------
   *
   * Backend expects:
   *     /api/admin/quotes/{quote_id}
   *
   * quote_id must be an integer.
   */
  const openQuote = (quote) => {
    const rawQuoteId =
      getQuoteId(quote);

    if (
      rawQuoteId === null ||
      rawQuoteId === undefined ||
      String(rawQuoteId).trim() === ""
    ) {
      console.error(
        "SKYTECH: Quote ID is missing.",
        quote
      );

      return;
    }

    const numericQuoteId =
      Number(rawQuoteId);

    if (
      !Number.isInteger(
        numericQuoteId
      ) ||
      numericQuoteId <= 0
    ) {
      console.error(
        "SKYTECH: Quote ID must be a valid positive integer.",
        {
          rawQuoteId,
          quote,
        }
      );

      return;
    }

    sessionStorage.setItem(
      "selected_quote_id",
      String(numericQuoteId)
    );

    navigate(
      `/admin/quotes/${numericQuoteId}/edit`
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <AdminPortalShell
      activeRoute="/admin/quotes"
      title="Quote Management"
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
                  Quote Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review customer quotations, monitor
                  quotation status and open quotations
                  for editing.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Total Quotes
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {loading
                      ? "..."
                      : quotes.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadQuotes}
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
                  Unable to load quotations
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={loadQuotes}
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
              All Quotes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : quotes.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total quotations received
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Showing
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : filteredQuotes.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Matching current filters
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Quote Value
            </p>

            <p className="mt-2 truncate text-2xl font-bold text-slate-900">
              {loading
                ? "..."
                : formatCurrency(
                    totalAmount
                  )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total value of displayed quotes
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
                htmlFor="quote-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Quotations
              </label>

              <input
                id="quote-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by quote ID, customer, company..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            <div className="w-full lg:w-56">

              <label
                htmlFor="quote-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="quote-status"
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
            QUOTE TABLE
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:p-6">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Commercial Operations
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Quotation Records
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {loading
                ? "Loading..."
                : `${filteredQuotes.length} quote${
                    filteredQuotes.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

          {loading ? (

            <div className="p-12 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading quotation records...
              </p>

            </div>

          ) : filteredQuotes.length === 0 ? (

            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ₹
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No quotations found
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
                      Quote
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Company
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Requirement
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
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

                  {filteredQuotes.map(
                    (quote, index) => {

                      const quoteId =
                        getQuoteId(quote);

                      const quoteCode =
                        getQuoteCode(quote);

                      const customer =
                        quote?.customer_name ??
                        quote?.customer ??
                        "-";

                      const company =
                        quote?.company ?? "-";

                      const requirement =
                        quote?.requirement ??
                        quote?.requirements ??
                        "-";

                      const amount =
                        quote?.total_amount ??
                        quote?.total ??
                        quote?.amount;

                      const status =
                        quote?.status ??
                        "pending";

                      return (
                        <tr
                          key={
                            quoteId ??
                            quoteCode ??
                            index
                          }
                          onClick={() =>
                            openQuote(quote)
                          }
                          className="cursor-pointer transition hover:bg-blue-50/40"
                        >

                          <td className="px-5 py-4">

                            <div>
                              <p className="font-semibold text-slate-900">
                                {quoteCode}
                              </p>

                              {quoteId !== null &&
                                quoteId !== undefined && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    ID: {quoteId}
                                  </p>
                                )}
                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium text-slate-800">
                              {customer}
                            </p>

                            {quote?.email && (
                              <p className="mt-1 text-xs text-slate-500">
                                {quote.email}
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {company}
                          </td>

                          <td className="max-w-[260px] px-5 py-4">

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

                            <span className="font-semibold text-slate-900">
                              {formatCurrency(
                                amount
                              )}
                            </span>

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

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              quote?.created_at ??
                                quote?.createdAt ??
                                quote?.date
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">

                            {quoteId !== null &&
                            quoteId !== undefined ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openQuote(quote);
                                }}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                              >
                                View / Edit
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
            SKYTECH Admin Portal · Quote Management
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