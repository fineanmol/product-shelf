// src/pages/AdminProducts.jsx
import React from "react";
import { Link } from "react-router-dom";
import AdminProductTable from "../../components/AdminProductTable";
import { FaPlus, FaBox, FaSearch, FaFilter } from "react-icons/fa";

function AdminProducts() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">
                Manage your product inventory and track performance.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {/* <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FaBox className="text-blue-600 text-lg" />
              <div>
                <h2 className="font-semibold text-gray-900">Product Inventory</h2>
                <p className="text-gray-600 text-sm">Manage your product catalog</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
         
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg px-4 py-2">
                <FaSearch className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-48"
                />
              </div>
              
    
              <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                <FaFilter className="text-gray-600" />
                <span className="hidden sm:inline text-gray-700 font-medium">Filter</span>
              </button>
              
             
              <Link
                to="/admin/products/add"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <FaPlus className="text-sm" />
                <span>Add Product</span>
              </Link>
            </div>
          </div>
        </div> */}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">All Products</h3>
                <p className="text-gray-600 text-sm">Complete list of your product inventory</p>
              </div>
            </div>
          </div>
          
          {/* Table Content */}
          <div className="p-6">
            <AdminProductTable />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProducts;
