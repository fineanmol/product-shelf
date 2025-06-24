// src/components/admin/DashboardProducts.jsx
import React, { useEffect, useState, useMemo } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { Link } from "react-router-dom";
import {
  getCurrentUserRole,
  filterDataByUserRole,
} from "../../utils/permissions";

const DashboardProducts = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const db = getDatabase();

      // Get current user role
      const userRoleData = await getCurrentUserRole();
      setUserRole(userRoleData);

      const snap = await get(ref(db, "products"));
      if (snap.exists()) {
        let data = snap.val();
        let entries = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
        }));

        setAllProducts(entries);
      }
    };

    fetchProducts();
  }, []);

  // Memoize expensive filtering, sorting, and slicing operations
  const products = useMemo(() => {
    if (!allProducts.length || !userRole) return [];

    // Filter products based on user role
    let filteredEntries = filterDataByUserRole(
      allProducts,
      userRole.role,
      userRole.user?.uid,
      userRole.isSuperAdmin
    );

    // Sort by timestamp descending and take top 5
    return filteredEntries
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);
  }, [allProducts, userRole]);

  if (!products.length) {
    return <p className="text-gray-500">No products found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
          <tr>
            <th className="px-4 py-2">Image</th>
            <th className="px-4 py-2">Product</th>
            <th className="px-4 py-2">Price</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y text-gray-700">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-2">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded shadow"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                    N/A
                  </div>
                )}
              </td>

              <td
                className="px-4 py-2 max-w-[160px] whitespace-nowrap overflow-hidden overflow-ellipsis"
                title={product.title}
              >
                {product.title || "Untitled"}
              </td>

              <td className="px-4 py-2">
                {product.price != null ? `€${product.price}` : "--"}
              </td>

              <td className="px-4 py-2">
                <span
                  className={
                    product.status === "available"
                      ? "inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-600"
                      : "inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-600"
                  }
                >
                  {product.status || "Unknown"}
                </span>
              </td>

              <td className="px-4 py-2 text-gray-500">
                {product.timestamp
                  ? new Date(product.timestamp).toLocaleDateString()
                  : "--"}
              </td>

              <td className="px-4 py-2 text-right">
                <Link
                  to={`/admin/products/edit/${product.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Show link to "All Products" if you have a dedicated page */}
      <div className="text-right mt-3">
        <Link
          to="/admin/products"
          className="inline-block text-blue-600 hover:underline text-sm font-medium"
        >
          View All Products
        </Link>
      </div>
    </div>
  );
};

export default DashboardProducts;
