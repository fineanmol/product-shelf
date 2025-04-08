import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { Link } from "react-router-dom";
import { getUserAccess } from "../utils/permissions";

const ProductAdminList = () => {
  const [products, setProducts] = useState([]);
  const [interestData, setInterestData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [interestSearch, setInterestSearch] = useState({});
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const db = getDatabase();
    const fetchProducts = async () => {
      const snapshot = await get(ref(db, "/"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setProducts(entries);
      }
    };

    const fetchInterests = async () => {
      const snapshot = await get(ref(db, "interests"));
      if (snapshot.exists()) {
        setInterestData(snapshot.val());
      }
    };

    fetchProducts();
    fetchInterests();
  }, []);

  const handleToggle = async (id, key, value) => {
    const db = getDatabase();
    await update(ref(db, `/${id}`), { [key]: value });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: value } : p))
    );
  };

  const filteredProducts = products.filter((product) =>
    product.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const valA = a[sortKey] ?? "";
    const valB = b[sortKey] ?? "";

    if (sortKey === "price") {
      const priceA = parseFloat(valA.replace(/[^\d.]/g, "")) || 0;
      const priceB = parseFloat(valB.replace(/[^\d.]/g, "")) || 0;
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    }

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

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

  const handleExportCSV = (productId) => {
    const entries = interestData[productId]
      ? Object.values(interestData[productId])
      : [];
    const csv = [
      ["Name", "Email", "Phone"].join(","),
      ...entries.map((e) => [e.name, e.email, e.phone].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${productId}_interests.csv`;
    link.click();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="lg:text-2xl text-xl font-semibold">All Products</h2>

        <div className="flex gap-2 w-full md:w-auto h-10">
          <input
            type="text"
            placeholder="Search products..."
            className="border px-3 py-2 rounded w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link
            to="/admin/add"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <span className="lg:text-lg text-md whitespace-nowrap">
              Add Product
            </span>
          </Link>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="min-w-full table-auto border rounded-xl overflow-hidden text-sm">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
            <tr className="whitespace-nowrap">
              <th
                className="text-left px-4 py-2 cursor-pointer"
                onClick={() => handleSort("title")}
              >
                Product {renderSortIcon("title")}
              </th>
              <th
                className="text-left px-4 py-2 cursor-pointer"
                onClick={() => handleSort("price")}
              >
                Price {renderSortIcon("price")}
              </th>
              <th
                className="text-left px-4 py-2 cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status {renderSortIcon("status")}
              </th>
              <th
                className="text-left px-4 py-2 cursor-pointer"
                onClick={() => handleSort("visible")}
              >
                Visible {renderSortIcon("visible")}
              </th>
              <th
                className="text-left px-4 py-2 cursor-pointer"
                onClick={() => handleSort("updatedAt")}
              >
                Updated {renderSortIcon("updatedAt")}
              </th>
              <th className="text-left px-4 py-2">Interested</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedProducts.map((p) => {
              const interests = interestData[p.id] || {};
              const { canEdit } = getUserAccess(p);
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

              return (
                <tr
                  key={p.id}
                  className="border-b hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-4 py-2 min-w-[250px] break-words">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {p.title}
                        </div>
                        {!canEdit && (
                          <div className="text-xs text-yellow-600 italic">
                            Read-only
                          </div>
                        )}
                        <div className="text-gray-500 text-xs">{p.source}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">{p.price}</td>
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
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {p.updatedAt || "--"}
                  </td>

                  {/* Interested Users */}
                  <td className="px-4 py-2 text-xs max-w-[240px]">
                    <details open={canEdit}>
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
                      <button
                        disabled={!canEdit}
                        onClick={() => handleExportCSV(p.id)}
                        className={`mt-2 px-3 py-1 rounded text-xs ${
                          canEdit
                            ? "bg-gray-100 hover:bg-gray-200"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Export CSV
                      </button>
                    </details>
                  </td>

                  <td className="px-4 py-2 text-right">
                    {canEdit ? (
                      <Link
                        to={`/admin/edit/${p.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </Link>
                    ) : (
                      <span className="text-xs text-yellow-600 italic">
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

export default ProductAdminList;
