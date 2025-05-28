// src/pages/AdminProducts.jsx
import React from "react";
import { Link } from "react-router-dom";
import AdminProductTable from "../../components/AdminProductTable";

function AdminProducts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <Link
          to="/admin/products/add"
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
        >
          Add Product
        </Link>
      </div>
      <AdminProductTable />
    </div>
  );
}

export default AdminProducts;
