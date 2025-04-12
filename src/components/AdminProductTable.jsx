import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, update, remove } from "firebase/database";
import { Link } from "react-router-dom";
import { getUserAccess } from "../utils/permissions";
import { usePageTitle } from "../hooks/usePageTitle";
import SearchInput from "./shared/SearchInput";
import ExportCSVButton from "./shared/ExportCSVButton";
// React Icons
import { FiEdit } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { FaFileExport, FaLock } from "react-icons/fa";
import { showToast } from "../utils/showToast";

const AdminProductTable = () => {
  const [products, setProducts] = useState([]);
  const [interestData, setInterestData] = useState({});
  const [accessMap, setAccessMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [interestSearch, setInterestSearch] = useState({});

  // Default sort by product "timestamp" in descending order
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  usePageTitle({ value: "Admin Dashboard" });

  useEffect(() => {
    const db = getDatabase();
    const fetchData = async () => {
      const productsSnap = await get(ref(db, "products"));
      const interestsSnap = await get(ref(db, "interests"));

      if (productsSnap.exists()) {
        const data = productsSnap.val();
        const entries = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));

        setProducts(entries);

        // Gather edit permissions
        const accessResults = await Promise.all(
          entries.map((product) =>
            getUserAccess(product).then((access) => ({
              id: product.id,
              access,
            }))
          )
        );

        const map = {};
        accessResults.forEach(({ id, access }) => {
          map[id] = access;
        });

        setAccessMap(map);
      }

      if (interestsSnap.exists()) {
        setInterestData(interestsSnap.val());
      }
    };

    fetchData();
  }, []);

  const handleToggle = async (id, key, value) => {
    const db = getDatabase();
    await update(ref(db, `products/${id}`), { [key]: value });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: value } : p))
    );
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return;

    const db = getDatabase();
    await remove(ref(db, `products/${id}`));
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("✅ Product deleted successfully.");
  };

  // Filter products by search term in the title
  const filteredProducts = products.filter((product) =>
    product.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort products based on sortKey/sortOrder
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const valA = a[sortKey] ?? "";
    const valB = b[sortKey] ?? "";

    // Numeric fields
    if (["price", "min_price", "timestamp", "updatedAt"].includes(sortKey)) {
      return sortOrder === "asc"
        ? (valA ?? 0) - (valB ?? 0)
        : (valB ?? 0) - (valA ?? 0);
    }

    // String fields
    return sortOrder === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (key) => {
    if (sortKey !== key) return <span className="ml-1">⇅</span>;
    return sortOrder === "asc" ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  // Export all products to CSV/Excel
  const handleExportAll = () => {
    // Decide which fields to export
    const headers = [
      "id",
      "title",
      "price",
      "min_price",
      "status",
      "visible",
      "timestamp",
      "updatedAt",
    ];

    // Transform each product into a row of CSV data
    const csvRows = [headers.join(",")];
    sortedProducts.forEach((p) => {
      const row = [
        p.id,
        `"${p.title ?? ""}"`, // wrap in quotes for text fields
        p.price ?? "",
        p.min_price ?? "",
        p.status ?? "",
        p.visible === false ? "hidden" : "visible",
        p.timestamp ?? "",
        p.updatedAt ?? "",
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `all_products.csv`;
    link.click();
  };

  // Helper to calculate "days live"
  const getDaysLive = (timestamp) => {
    if (!timestamp) return null;
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="lg:text-2xl text-xl font-semibold">All Products</h2>
        <div className="flex gap-2 w-full md:w-auto h-10">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center"
            >
              <FaFileExport className="mr-1" />
              Export All
            </button>
            <Link
              to="/admin/products/add"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <span className="lg:text-lg text-md whitespace-nowrap">
                Add Product
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="min-w-full table-auto border rounded-xl overflow-hidden text-sm">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
            <tr className="whitespace-nowrap">
              <th
                onClick={() => handleSort("title")}
                className="px-4 py-2 cursor-pointer text-left"
              >
                Product {renderSortIcon("title")}
              </th>
              <th
                onClick={() => handleSort("price")}
                className="px-4 py-2 cursor-pointer text-left"
              >
                Price {renderSortIcon("price")}
              </th>
              <th
                onClick={() => handleSort("min_price")}
                className="px-4 py-2 cursor-pointer text-left"
              >
                Min Price {renderSortIcon("min_price")}
              </th>
              <th
                onClick={() => handleSort("status")}
                className="px-4 py-2 cursor-pointer text-left"
              >
                Status {renderSortIcon("status")}
              </th>
              <th
                onClick={() => handleSort("visible")}
                className="px-4 py-2 cursor-pointer text-left"
              >
                Visible {renderSortIcon("visible")}
              </th>
              <th
                onClick={() => handleSort("updatedAt")}
                className="px-4 py-2 cursor-pointer text-left"
              >
                Last Updated {renderSortIcon("updatedAt")}
              </th>
              <th
                onClick={() => handleSort("timestamp")}
                className="px-4 py-2 cursor-pointer text-left"
              >
                Product Added {renderSortIcon("timestamp")}
              </th>
              <th className="px-4 py-2 text-left">Interested</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedProducts.map((p) => {
              const interests = interestData[p.id] || {};
              const { canEdit } = accessMap[p.id] || {};
              const filteredInterests = Object.values(interests).filter((i) =>
                interestSearch[p.id]
                  ? i.name
                      ?.toLowerCase()
                      .includes(interestSearch[p.id].toLowerCase()) ||
                    i.email
                      ?.toLowerCase()
                      .includes(interestSearch[p.id].toLowerCase())
                  : true
              );

              const daysLive = getDaysLive(p.timestamp);

              return (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  {/* Product Title & Days Live */}
                  <td className="px-4 py-2 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="max-w-[160px] whitespace-nowrap overflow-hidden overflow-ellipsis">
                        <div
                          className="font-medium text-gray-900"
                          title={p.title}
                        >
                          {p.title}
                        </div>
                        {!canEdit && (
                          <div className="text-xs text-yellow-600 italic flex items-center gap-1">
                            <FaLock />
                            Read-only
                          </div>
                        )}
                        <div className="text-gray-500 text-xs">
                          {daysLive !== null
                            ? `Listed ${daysLive} day${
                                daysLive === 1 ? "" : "s"
                              } ago`
                            : "--"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="w-20 px-2 py-1 text-sm border rounded"
                      value={p.price}
                      disabled={!canEdit}
                      onChange={(e) =>
                        canEdit &&
                        handleToggle(p.id, "price", Number(e.target.value))
                      }
                    />
                  </td>

                  {/* Min Price */}
                  <td className="px-4 py-2">{p.min_price ?? "--"}</td>

                  {/* Status */}
                  <td className="px-4 py-2">
                    <button
                      onClick={() =>
                        canEdit &&
                        handleToggle(
                          p.id,
                          "status",
                          p.status === "available" ? "reserved" : "available"
                        )
                      }
                      className={`px-2 py-1 rounded text-xs font-semibold transition ${
                        p.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      } ${
                        !canEdit
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:brightness-95"
                      }`}
                    >
                      {p.status || "Unknown"}
                    </button>
                  </td>

                  {/* Visible */}
                  <td className="px-4 py-2">
                    <button
                      onClick={() =>
                        canEdit &&
                        handleToggle(p.id, "visible", !(p.visible !== false))
                      }
                      className={`px-2 py-1 rounded text-xs font-medium transition ${
                        p.visible === false
                          ? "bg-gray-200 text-gray-600"
                          : "bg-green-100 text-green-600"
                      } ${
                        !canEdit
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:brightness-95"
                      }`}
                    >
                      {p.visible === false ? "Hidden" : "Visible"}
                    </button>
                  </td>

                  {/* Last Updated */}
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {p.updatedAt
                      ? new Date(p.updatedAt).toLocaleString()
                      : "--"}
                  </td>

                  {/* Product Added */}
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {p.timestamp
                      ? new Date(p.timestamp).toLocaleDateString()
                      : "--"}
                  </td>

                  {/* Interested Section */}
                  <td className="px-4 py-2 text-xs max-w-[240px]">
                    <details>
                      <summary
                        className={`cursor-pointer font-medium ${
                          canEdit ? "text-blue-600" : "text-gray-400"
                        }`}
                      >
                        {Object.keys(interests).length} interested
                      </summary>
                      <input
                        type="text"
                        className="mt-2 mb-1 w-full border px-2 py-1 rounded text-xs"
                        placeholder="Search name/email"
                        disabled={!canEdit}
                        value={interestSearch[p.id] || ""}
                        onChange={(e) =>
                          setInterestSearch((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                      />
                      <ul className="text-gray-700 text-xs space-y-1 mt-1 max-h-32 overflow-auto">
                        {filteredInterests.map((entry, i) => (
                          <li key={i} className="border p-2 rounded">
                            <div className="font-semibold">{entry.name}</div>
                            <div>{entry.email}</div>
                            <a
                              href={`https://wa.me/${entry.phone.replace(
                                /\D/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 underline"
                            >
                              {entry.phone}
                            </a>
                          </li>
                        ))}
                      </ul>
                      {canEdit && (
                        <ExportCSVButton
                          data={filteredInterests.map((e) => ({
                            name: e.name,
                            email: e.email,
                            phone: e.phone,
                          }))}
                          headers={["name", "email", "phone"]}
                          filename={`${p.id}_interests.csv`}
                        />
                      )}
                    </details>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2 text-right">
                    {canEdit ? (
                      <div className="flex items-center gap-3 justify-end">
                        <Link
                          to={`/admin/products/edit/${p.id}`}
                          className="text-blue-600 hover:underline text-sm"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="Delete"
                          className="text-gray-500 hover:underline hover:text-black"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-yellow-600 italic flex items-center gap-1 justify-end">
                        <FaLock />
                        Read-only
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductTable;
