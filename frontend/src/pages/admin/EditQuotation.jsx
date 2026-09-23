import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

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
  return String(status || "pending")
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

function getQuoteIdFromStorage() {
  return sessionStorage.getItem(
    "selected_quote_id"
  );
}

function getQuoteIdFromRoute(id) {
  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {
    return null;
  }

  const numericId = Number(id);

  if (
    !Number.isInteger(numericId) ||
    numericId <= 0
  ) {
    return null;
  }

  return numericId;
}

export default function EditQuotation() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [quote, setQuote] = useState(null);

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * ------------------------------------------------------------
   * Resolve quotation ID
   * ------------------------------------------------------------
   *
   * Prefer the route:
   *
   * /admin/quotes/:id/edit
   *
   * and fall back to the existing sessionStorage
   * behavior so existing navigation continues working.
   */
  const resolveQuoteId = () => {
    const routeId =
      getQuoteIdFromRoute(id);

    if (routeId) {
      return routeId;
    }

    const storedId =
      getQuoteIdFromRoute(
        getQuoteIdFromStorage()
      );

    return storedId;
  };

  /*
   * ------------------------------------------------------------
   * Error message helper
   * ------------------------------------------------------------
   */
  const getErrorMessage = async (
    response
  ) => {
    let message =
      `Quotation API failed: ${response.status}`;

    try {
      const data =
        await response.json();

      if (data?.detail) {
        if (
          typeof data.detail ===
          "string"
        ) {
          message = data.detail;
        } else if (
          Array.isArray(
            data.detail
          )
        ) {
          message = data.detail
            .map((item) => {
              const location =
                Array.isArray(
                  item?.loc
                )
                  ? item.loc.join(".")
                  : "field";

              return `${location}: ${
                item?.msg ||
                "Invalid value"
              }`;
            })
            .join("\n");
        } else {
          message = JSON.stringify(
            data.detail
          );
        }
      } else if (
        data?.message
      ) {
        message = data.message;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    return message;
  };

  /*
   * ------------------------------------------------------------
   * Load quotation
   * ------------------------------------------------------------
   */
  const loadQuotation = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const quoteId =
        resolveQuoteId();

      if (!quoteId) {
        sessionStorage.removeItem(
          "selected_quote_id"
        );

        navigate(
          "/admin/quotes",
          {
            replace: true,
          }
        );

        return;
      }

      sessionStorage.setItem(
        "selected_quote_id",
        String(quoteId)
      );

      const response =
        await apiFetch(
          `/api/admin/quotes/${quoteId}`
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response
          )
        );
      }

      const data =
        await response.json();

      const loadedQuote =
        data?.quote ||
        data;

      if (!loadedQuote) {
        throw new Error(
          "Quotation record was not returned by the server."
        );
      }

      setQuote(
        loadedQuote
      );

      const loadedAmount =
        loadedQuote?.amount ??
        loadedQuote?.total_amount ??
        loadedQuote?.total ??
        "";

      setAmount(
        loadedAmount === null ||
        loadedAmount === undefined
          ? ""
          : String(
              loadedAmount
            )
      );

      setStatus(
        loadedQuote?.status ||
        ""
      );
    } catch (err) {
      console.error(
        "Edit Quotation Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load quotation."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotation();
  }, [id]);

  /*
   * ------------------------------------------------------------
   * Save quotation
   * ------------------------------------------------------------
   *
   * Existing backend behavior only updates:
   *
   * amount
   * status
   *
   * Keep this payload intentionally limited.
   */
  const saveQuotation = async (
    event
  ) => {
    event?.preventDefault();

    setError("");
    setSuccess("");

    const quoteId =
      resolveQuoteId();

    if (!quoteId) {
      setError(
        "Quotation ID is missing or invalid."
      );

      return;
    }

    let cleanedAmount =
      amount
        .trim()
        .replace(/,/g, "");

    /*
     * Validate amount.
     */
    if (cleanedAmount !== "") {
      const numericAmount =
        Number(
          cleanedAmount
        );

      if (
        Number.isNaN(
          numericAmount
        )
      ) {
        setError(
          "Please enter a valid quotation amount."
        );

        return;
      }

      if (
        numericAmount < 0
      ) {
        setError(
          "Quotation amount cannot be negative."
        );

        return;
      }

      cleanedAmount =
        numericAmount;
    }

    /*
     * Build payload exactly around
     * supported editable fields.
     */
    const payload = {};

    if (
      cleanedAmount !== ""
    ) {
      payload.amount =
        cleanedAmount;
    }

    if (
      status.trim() !== ""
    ) {
      payload.status =
        status.trim();
    }

    if (
      Object.keys(
        payload
      ).length === 0
    ) {
      setError(
        "Please provide an amount or status to update."
      );

      return;
    }

    setSaving(true);

    try {
      const response =
        await apiFetch(
          `/api/admin/quotes/${quoteId}`,
          {
            method: "PUT",
            body: payload,
          }
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response
          )
        );
      }

      const data =
        await response.json();

      const updatedQuote =
        data?.quote ||
        data;

      /*
       * Refresh local quotation data.
       */
      if (
        updatedQuote &&
        typeof updatedQuote ===
          "object"
      ) {
        setQuote(
          updatedQuote
        );

        const updatedAmount =
          updatedQuote?.amount ??
          updatedQuote?.total_amount ??
          updatedQuote?.total ??
          cleanedAmount;

        setAmount(
          updatedAmount ===
            null ||
          updatedAmount ===
            undefined
            ? ""
            : String(
                updatedAmount
              )
        );

        if (
          updatedQuote?.status !==
          undefined
        ) {
          setStatus(
            updatedQuote.status ||
              ""
          );
        }
      }

      setSuccess(
        "Quotation updated successfully."
      );
    } catch (err) {
      console.error(
        "Quote update error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update quotation."
      );
    } finally {
      setSaving(false);
    }
  };

  const quoteId =
    resolveQuoteId();

  /*
   * ------------------------------------------------------------
   * Loading state
   * ------------------------------------------------------------
   */
  if (loading) {
    return (
      <AdminPortalShell
        activeRoute="/admin/quotes"
        title="Edit Quotation"
        subtitle="SKYTECH Digital Power Platform"
      >
        <div className="space-y-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />

            <div className="mt-4 h-8 w-72 animate-pulse rounded bg-slate-200" />

            <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-center text-sm text-slate-500">
              Loading quotation...
            </p>

          </div>

        </div>
      </AdminPortalShell>
    );
  }

  /*
   * ------------------------------------------------------------
   * Error / quotation unavailable
   * ------------------------------------------------------------
   */
  if (!quote) {
    return (
      <AdminPortalShell
        activeRoute="/admin/quotes"
        title="Edit Quotation"
        subtitle="SKYTECH Digital Power Platform"
      >
        <div className="space-y-6">

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-sm font-semibold text-red-800">
                Unable to load quotation
              </p>

              <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                {error}
              </p>

            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
              ₹
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Quotation not found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              The requested quotation could not
              be loaded. It may have been removed
              or the quotation ID may be invalid.
            </p>

            <Link
              to="/admin/quotes"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-blue-600"
            >
              ← Back to Quote Management
            </Link>

          </section>

        </div>
      </AdminPortalShell>
    );
  }

  const quoteCode =
    quote?.quote_code ??
    quote?.quote_number ??
    quote?.code ??
    quoteId ??
    "-";

  const customerName =
    quote?.customer_name ??
    quote?.customer ??
    "-";

  const company =
    quote?.company ?? "-";

  const requirement =
    quote?.requirement ??
    quote?.requirements ??
    "-";

  const createdAt =
    quote?.created_at ??
    quote?.createdAt ??
    quote?.date;

  const currentAmount =
    quote?.amount ??
    quote?.total_amount ??
    quote?.total ??
    amount;

  return (
    <AdminPortalShell
      activeRoute="/admin/quotes"
      title="Edit Quotation"
      subtitle="SKYTECH Digital Power Platform"
    >
      <div className="space-y-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="p-5 md:p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">

                  <Link
                    to="/admin/quotes"
                    className="font-medium text-slate-500 no-underline hover:text-blue-600"
                  >
                    Quote Management
                  </Link>

                  <span>/</span>

                  <span className="font-semibold text-slate-800">
                    Edit Quotation
                  </span>

                </div>

                <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Commercial Operations
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                    {quoteCode}
                  </h1>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                      status
                    )}`}
                  >
                    {normalizeStatus(
                      status
                    )}
                  </span>

                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Review quotation information and
                  update the amount or quotation status.
                </p>

              </div>

              <div className="flex flex-wrap gap-3">

                <Link
                  to="/admin/quotes"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
                >
                  ← Back to Quotes
                </Link>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

            <p className="text-sm font-semibold text-emerald-800">
              {success}
            </p>

          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-semibold text-red-800">
              Unable to update quotation
            </p>

            <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* ==================================================
            QUOTE INFORMATION
        ================================================== */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          {/* -----------------------------------------------
              LEFT: QUOTE DETAILS
          ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5 md:p-6">

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Customer Information
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Quotation Details
              </h2>

            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 md:p-6">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quote Number
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {safeText(
                    quoteCode
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Database ID
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {safeText(
                    quoteId
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {safeText(
                    customerName
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {safeText(
                    company
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Requirement
                </p>

                <p className="mt-2 leading-6 text-slate-800">
                  {safeText(
                    requirement
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatDate(
                    createdAt
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current Amount
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatCurrency(
                    currentAmount
                  )}
                </p>

              </div>

            </div>

          </div>

          {/* -----------------------------------------------
              RIGHT: EDIT PANEL
          ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5 md:p-6">

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Update
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Edit Quotation
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Update the commercial amount and
                quotation status. Other quotation
                information is read-only here.
              </p>

            </div>

            <form
              onSubmit={saveQuotation}
              className="space-y-6 p-5 md:p-6"
            >

              {/* Amount */}

              <div>

                <label
                  htmlFor="quotation-amount"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Quotation Amount
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                    ₹
                  </span>

                  <input
                    id="quotation-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter quotation amount"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Enter a non-negative amount. Commas
                  are accepted.
                </p>

              </div>

              {/* Status */}

              <div>

                <label
                  htmlFor="quotation-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Quotation Status
                </label>

                <select
                  id="quotation-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select Status
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="sent">
                    Sent
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="accepted">
                    Accepted
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>

                  <option value="expired">
                    Expired
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>

              </div>

              {/* Preview */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Update Preview
                </p>

                <div className="mt-3 flex items-center justify-between gap-4">

                  <div>
                    <p className="text-xs text-slate-500">
                      Amount
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {amount
                        ? formatCurrency(
                            amount.replace(
                              /,/g,
                              ""
                            )
                          )
                        : "-"}
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="text-xs text-slate-500">
                      Status
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                        status
                      )}`}
                    >
                      {normalizeStatus(
                        status
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* Buttons */}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <Link
                  to="/admin/quotes"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 no-underline transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

              </div>

            </form>

          </div>

        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <span>
            SKYTECH Admin Portal · Edit Quotation
          </span>

          <Link
            to="/admin/quotes"
            className="font-semibold text-slate-700 no-underline hover:text-blue-600"
          >
            ← Back to Quote Management
          </Link>

        </div>

      </div>
    </AdminPortalShell>
  );
}