// src/pages/EditProduct.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";
import ProductEditor from "../../components/product/ProductEditor";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const db = getDatabase();
      const snapshot = await get(ref(db, `products/${id}`));
      if (snapshot.exists()) {
        setProduct({ id, ...snapshot.val() });
      } else {
        navigate("/admin/products");
      }
    };
    fetchProduct();
  }, [id, navigate, refreshToggle]);

  const handleRefresh = () => setRefreshToggle((prev) => !prev);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return <ProductEditor product={product} onRefresh={handleRefresh} />;
};

export default EditProduct;
