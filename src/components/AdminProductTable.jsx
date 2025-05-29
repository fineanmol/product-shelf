import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, update, remove } from "firebase/database";
import { Link } from "react-router-dom";
import { getUserAccess, getCurrentUserRole, filterDataByUserRole } from "../utils/permissions";
import { usePageTitle } from "../hooks/usePageTitle";
import SearchInput from "./shared/SearchInput";
import ExportCSVButton from "./shared/ExportCSVButton";
// React Icons
import { FiEdit, FiDownload, FiEye, FiEyeOff } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { FaFileExport, FaLock, FaArrowUp, FaArrowDown, FaWhatsapp } from "react-icons/fa";
import { showToast } from "../utils/showToast";

const AdminProductTable = () => {
  const [products, setProducts] = useState([]);
  const [interestData, setInterestData] = useState({});
  const [accessMap, setAccessMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [interestSearch, setInterestSearch] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Default sort by product "timestamp" in descending order
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  usePageTitle({ value: "Admin Dashboard" });

  useEffect(() => {
    const db = getDatabase();
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user role
        const userRoleData = await getCurrentUserRole();
        setCurrentUserRole(userRoleData);

        const productsSnap = await get(ref(db, "products"));
        const interestsSnap = await get(ref(db, "interests"));

        if (productsSnap.exists()) {
          const data = productsSnap.val();
          let entries = Object.entries(data).map(([id, value]) => ({
            id,
            ...value,
          }));

          // Filter products based on user role
          entries = filterDataByUserRole(
            entries,
            userRoleData.role,
            userRoleData.user?.uid,
            userRoleData.isSuperAdmin
          );

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
          const allInterests = interestsSnap.val();
          
          // Filter interests based on user role
          if (userRoleData.isSuperAdmin) {
            // Super admins see all interests
            setInterestData(allInterests);
          } else {
            // Editors only see interests for their own products
            const filteredInterests = {};
            Object.keys(allInterests).forEach(productId => {
              // Check if this product belongs to the current user
              const productRef = ref(db, `products/${productId}`);
              get(productRef).then(productSnap => {
                if (productSnap.exists()) {
                  const productData = productSnap.val();
                  if (productData.added_by === userRoleData.user?.uid) {
                    filteredInterests[productId] = allInterests[productId];
                  }
                }
              });
            });
            setInterestData(filteredInterests);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast("❌ Error loading products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggle = async (id, key, value) => {
    try {
      const db = getDatabase();
      await update(ref(db, `products/${id}`), { [key]: value });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [key]: value } : p))
      );
      showToast("✅ Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      showToast("❌ Failed to update product");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return;

    try {
      const db = getDatabase();
      await remove(ref(db, `products/${id}`));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("✅ Product deleted successfully.");
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("❌ Failed to delete product");
    }
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
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? (
      <FaArrowUp className="text-xs text-blue-600" />
    ) : (
      <FaArrowDown className="text-xs text-blue-600" />
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
    link.download = `all_products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("✅ Export completed successfully");
  };

  // Helper to calculate "days live"
  const getDaysLive = (timestamp) => {
    if (!timestamp) return null;
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
            className="flex-1 sm:w-80"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {filteredProducts.length} of {products.length} products
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <FiDownload className="text-sm" />
            Export All
          </button>
          <Link
            to="/admin/products/add"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {products.length === 0 
              ? "Start by adding your first product"
              : "Try adjusting your search term"
            }
          </p>
          {products.length === 0 && (
            <Link
              to="/admin/products/add"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort("title")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Product
                      {renderSortIcon("title")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("price")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Price
                      {renderSortIcon("price")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("status")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {renderSortIcon("status")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("visible")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Visibility
                      {renderSortIcon("visible")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interests
                  </th>
                  <th 
                    onClick={() => handleSort("timestamp")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Created
                      {renderSortIcon("timestamp")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      {/* Product Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1 max-w-xs">
                            <div className="font-medium text-gray-900 truncate" title={p.title}>
                              {p.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {!canEdit && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                  <FaLock className="text-xs" />
                                  Read-only
                                </span>
                              )}
                              {daysLive !== null && (
                                <span className="text-xs text-gray-500">
                                  {daysLive === 0 ? 'Added today' : `${daysLive} day${daysLive === 1 ? '' : 's'} ago`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            className={`w-24 px-3 py-2 text-sm border rounded-lg transition-colors ${
                              canEdit 
                                ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                            value={p.price || ''}
                            disabled={!canEdit}
                            onChange={(e) =>
                              canEdit &&
                              handleToggle(p.id, "price", Number(e.target.value))
                            }
                            placeholder="Price"
                          />
                          {p.min_price && (
                            <span className="text-xs text-gray-500">
                              Min: ${p.min_price}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            canEdit &&
                            handleToggle(
                              p.id,
                              "status",
                              p.status === "available" ? "reserved" : "available"
                            )
                          }
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            p.status === "available"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          } ${
                            !canEdit
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          {p.status === "available" ? "Available" : "Reserved"}
                        </button>
                      </td>

                      {/* Visibility */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            canEdit &&
                            handleToggle(p.id, "visible", !(p.visible !== false))
                          }
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            p.visible === false
                              ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          } ${
                            !canEdit
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          {p.visible === false ? (
                            <>
                              <FiEyeOff className="text-xs" />
                              Hidden
                            </>
                          ) : (
                            <>
                              <FiEye className="text-xs" />
                              Visible
                            </>
                          )}
                        </button>
                      </td>

                      {/* Interests */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {Object.keys(interests).length}
                          </span>
                          <span className="text-gray-500 ml-1">interested</span>
                          
                          {Object.keys(interests).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs font-medium">
                                View Details
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg max-w-xs">
                                {canEdit && (
                                  <input
                                    type="text"
                                    className="w-full mb-2 px-2 py-1 text-xs border rounded"
                                    placeholder="Search contacts..."
                                    value={interestSearch[p.id] || ""}
                                    onChange={(e) =>
                                      setInterestSearch((prev) => ({
                                        ...prev,
                                        [p.id]: e.target.value,
                                      }))
                                    }
                                  />
                                )}
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {filteredInterests.slice(0, 5).map((entry, i) => (
                                    <div key={i} className="bg-white p-2 rounded border text-xs">
                                      <div className="font-medium text-gray-900">{entry.name}</div>
                                      <div className="text-gray-600">{entry.email}</div>
                                      <a
                                        href={`https://wa.me/${entry.phone.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-800"
                                      >
                                        <FaWhatsapp className="text-xs" />
                                        {entry.phone}
                                      </a>
                                    </div>
                                  ))}
                                  {filteredInterests.length > 5 && (
                                    <div className="text-xs text-gray-500 text-center">
                                      +{filteredInterests.length - 5} more
                                    </div>
                                  )}
                                </div>
                                {canEdit && filteredInterests.length > 0 && (
                                  <div className="mt-2">
                                    <ExportCSVButton
                                      data={filteredInterests.map((e) => ({
                                        name: e.name,
                                        email: e.email,
                                        phone: e.phone,
                                      }))}
                                      headers={["name", "email", "phone"]}
                                      filename={`${p.title.replace(/[^a-zA-Z0-9]/g, '_')}_contacts.csv`}
                                      className="text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {p.timestamp
                          ? new Date(p.timestamp).toLocaleDateString()
                          : "--"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {canEdit ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Link
                              to={`/admin/products/edit/${p.id}`}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit Product"
                            >
                              <FiEdit className="text-sm" />
                            </Link>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Product"
                            >
                              <MdDelete className="text-sm" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            <FaLock className="text-xs" />
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
      )}
    </div>
  );
};

export default AdminProductTable;
