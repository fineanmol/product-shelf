// src/pages/EditProduct.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";
import ProductEditor from "../components/ProductEditor";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const db = getDatabase();
      const snapshot = await get(ref(db, `/${id}`));
      if (snapshot.exists()) {
        setProduct({ id, ...snapshot.val() });
      } else {
        navigate("/admin"); // Redirect if product not found
      }
    };
    fetchProduct();
  }, [id, navigate, refreshToggle]);

  const handleRefresh = () => setRefreshToggle(prev => !prev);

  if (!product) {
    return <p className="text-center mt-10">Loading product...</p>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Product</h2>
        <button
          onClick={() => navigate("/admin")}
          className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          ← Back to List
        </button>
      </div>
      <ProductEditor product={product} onRefresh={handleRefresh} />
    </div>
  );
};

export default EditProduct;
