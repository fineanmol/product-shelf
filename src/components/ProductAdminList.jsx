// src/components/ProductAdminList.jsx
import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { Link } from "react-router-dom";

const statusColor = {
  available: "text-green-600 bg-green-100",
  reserved: "text-red-600 bg-red-100",
  sold: "text-gray-600 bg-gray-100",
};

const ProductAdminList = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchProducts = async () => {
      const db = getDatabase();
      const snapshot = await get(ref(db, "/"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setProducts(entries);
      }
    };
    fetchProducts();
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
    return sortOrder === "asc" ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-2xl font-semibold">All Products</h2>
        <div className="flex gap-2 w-full md:w-auto">
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
            Add Product
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border rounded-xl overflow-hidden text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 cursor-pointer" onClick={() => handleSort("title")}>Product {renderSortIcon("title")}</th>
              <th className="text-left px-4 py-2 cursor-pointer" onClick={() => handleSort("price")}>Price {renderSortIcon("price")}</th>
              <th className="text-left px-4 py-2 cursor-pointer" onClick={() => handleSort("status")}>Status {renderSortIcon("status")}</th>
              <th className="text-left px-4 py-2 cursor-pointer" onClick={() => handleSort("visible")}>Visible {renderSortIcon("visible")}</th>
              <th className="text-left px-4 py-2 cursor-pointer" onClick={() => handleSort("updatedAt")}>Updated {renderSortIcon("updatedAt")}</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((p) => (
              <tr
                key={p.id}
                className="border-b hover:bg-gray-50 transition duration-150"
              >
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{p.title}</div>
                      <div className="text-gray-500 text-xs">{p.source}</div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-2">{p.price}</td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => handleToggle(p.id, "status", p.status === "available" ? "reserved" : "available")}
                    className={`px-2 py-1 rounded text-xs font-semibold transition duration-200 ${
                      p.status === "available"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {p.status || "Unknown"}
                  </button>
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => handleToggle(p.id, "visible", !(p.visible !== false))}
                    className={`px-2 py-1 rounded text-xs font-medium transition duration-200 ${
                      p.visible === false
                        ? "bg-gray-200 text-gray-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {p.visible === false ? "Hidden" : "Visible"}
                  </button>
                </td>

                <td className="px-4 py-2 text-gray-500 text-xs">
                  {p.updatedAt || "--"}
                </td>

                <td className="px-4 py-2 text-right">
                  <Link
                    to={`/admin/edit/${p.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductAdminList;
