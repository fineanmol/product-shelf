// src/pages/admin/sales-report.jsx
//
// Admin "Sales Report" page: lists every sold product (status === 'sold')
// with its sale price, sale date and internal notes, plus a totals summary.
//
// Sale date reliability: going forward, products are expected to carry a
// `sold_at` timestamp set at the moment they're marked sold. Older products
// marked sold before that field existed won't have it, so this page falls
// back to `updatedAt` and visually flags that row's date as approximate
// (updatedAt is set on every edit, not just on the sold transition, so it's
// not a guaranteed "date sold" signal for those older rows).
import React, { useEffect, useMemo, useState } from "react";
import { FaReceipt, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ExportCSVButton from "../../components/shared/ExportCSVButton";
import { getCurrentUserRole } from "../../utils/permissions";
import { getSoldProducts } from "../../services/productsService";
import { currencySymbols } from "../../utils/utils";
import { showToast } from "../../utils/showToast";

const formatMoney = (amount, currency) => {
  const symbol = currencySymbols[currency] || "€";
  const value = Number(amount) || 0;
  return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

// Resolves the best-available sale date for a product: the reliable
// `sold_at` field going forward, or `updatedAt` as an approximate fallback
// for products marked sold before that field existed. Returns null (rather
// than "now") when neither is present, so such rows sort last and render a
// "—" instead of a misleading date.
const resolveSaleDate = (product) => {
  if (product.sold_at) return { timestamp: product.sold_at, approx: false };
  if (product.updatedAt) return { timestamp: product.updatedAt, approx: true };
  return { timestamp: null, approx: false };
};

const SalesReport = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    fetchSoldProducts();
  }, []);

  const fetchSoldProducts = async () => {
    setLoading(true);
    try {
      const roleData = await getCurrentUserRole();
      setUserRole(roleData);
      const sold = await getSoldProducts(roleData.user?.uid, roleData.isSuperAdmin);
      setProducts(sold);
    } catch (error) {
      console.error("Error fetching sold products:", error);
      showToast("❌ Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    return products.map((product) => {
      const { timestamp, approx } = resolveSaleDate(product);
      return { product, saleTimestamp: timestamp, saleDateApprox: approx };
    });
  }, [products]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    sorted.sort((a, b) => {
      let diff;
      if (sortBy === "price") {
        diff = (a.product.price || 0) - (b.product.price || 0);
      } else {
        diff = (a.saleTimestamp || 0) - (b.saleTimestamp || 0);
      }
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [rows, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  const sortIcon = (column) => {
    if (sortBy !== column) return <FaSort className="text-stone-300" />;
    return sortDir === "asc" ? <FaSortUp className="text-brand-sky" /> : <FaSortDown className="text-brand-sky" />;
  };

  // Sum revenue per-currency rather than blindly adding raw numbers together
  // — if the data ever mixes currencies, a single combined total would be
  // meaningless. In practice every product defaults to EUR (see
  // buildProductPayload.js / currencySymbols), so this almost always renders
  // as a single total, but stays correct if that ever changes.
  const totals = useMemo(() => {
    const byCurrency = {};
    for (const { product } of rows) {
      const currency = product.currency || "EUR";
      byCurrency[currency] = (byCurrency[currency] || 0) + (Number(product.price) || 0);
    }
    return byCurrency;
  }, [rows]);

  const csvData = useMemo(() => {
    return sortedRows.map(({ product, saleTimestamp, saleDateApprox }) => ({
      title: product.title || "",
      price: product.price ?? "",
      currency: product.currency || "EUR",
      sold_date: saleTimestamp ? new Date(saleTimestamp).toLocaleDateString() : "",
      approx_date: saleDateApprox ? "yes" : "no",
      admin_note: product.admin_note || "",
      seller: product.added_email || "",
    }));
  }, [sortedRows]);

  const csvHeaders = ["title", "price", "currency", "sold_date", "approx_date", "admin_note", "seller"];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <LoadingSpinner text="Loading sales report..." />
      </div>
    );
  }

  const isSuperAdmin = !!userRole?.isSuperAdmin;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-soft border border-stone-200 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-title-lg text-stone-900 flex items-center gap-2">
                <FaReceipt className="text-brand-sky" />
                Sales Report
              </h1>
              <p className="text-body text-stone-600 mt-1">
                {sortedRows.length} sold {sortedRows.length === 1 ? "item" : "items"}
              </p>
            </div>
            {sortedRows.length > 0 && (
              <ExportCSVButton
                data={csvData}
                headers={csvHeaders}
                filename={`sales-report-${new Date().toISOString().split("T")[0]}.csv`}
              />
            )}
          </div>
        </div>

        {/* Table / Empty state */}
        <div className="bg-white rounded-xl shadow-soft border border-stone-200 overflow-hidden">
          {sortedRows.length === 0 ? (
            <div className="text-center py-16">
              <FaReceipt className="text-stone-400 text-5xl mx-auto mb-4" />
              <h3 className="text-title-lg text-stone-900 mb-2">No sales recorded yet</h3>
              <p className="text-body text-stone-600">
                Products marked as sold will show up here once you have some.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-stone-600 text-xs uppercase tracking-wide">
                      Title
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-stone-600 text-xs uppercase tracking-wide cursor-pointer select-none"
                      onClick={() => handleSort("price")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Sold Price {sortIcon("price")}
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-stone-600 text-xs uppercase tracking-wide cursor-pointer select-none"
                      onClick={() => handleSort("date")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Sold Date {sortIcon("date")}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-600 text-xs uppercase tracking-wide">
                      Internal Notes
                    </th>
                    {isSuperAdmin && (
                      <th className="px-4 py-3 text-left font-semibold text-stone-600 text-xs uppercase tracking-wide">
                        Seller
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sortedRows.map(({ product, saleTimestamp, saleDateApprox }) => (
                    <tr key={product.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3 max-w-[260px]">
                        <p className="font-semibold text-stone-900 truncate text-sm" title={product.title}>
                          {product.title || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-brand-navy">
                        {formatMoney(product.price, product.currency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-stone-700">
                        {saleTimestamp ? (
                          <span
                            title={
                              saleDateApprox
                                ? "Exact sale date unknown — showing the last-updated date instead"
                                : undefined
                            }
                          >
                            {new Date(saleTimestamp).toLocaleDateString()}
                            {saleDateApprox && (
                              <span className="text-caption text-stone-400 ml-1">(approx)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[320px]">
                        {product.admin_note ? (
                          <p className="text-stone-700 truncate" title={product.admin_note}>
                            {product.admin_note}
                          </p>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-stone-500 max-w-[200px] truncate" title={product.added_email}>
                          {product.added_email || "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50 border-t border-stone-200">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      Total ({sortedRows.length} {sortedRows.length === 1 ? "item" : "items"})
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-navy" colSpan={isSuperAdmin ? 4 : 3}>
                      {Object.entries(totals)
                        .map(([currency, amount]) => formatMoney(amount, currency))
                        .join(" + ")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
