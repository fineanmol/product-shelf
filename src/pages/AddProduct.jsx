// src/pages/AddProduct.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";

const AddProduct = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Add New Product</h2>
        <button
          onClick={() => navigate("/admin")}
          className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          ← Back to List
        </button>
      </div>
      <ProductForm />
    </div>
  );
};

export default AddProduct;
