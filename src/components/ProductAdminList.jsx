// src/components/ProductAdminList.jsx
import React, { useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import ProductEditor from "./ProductEditor";

const ProductAdminList = () => {
  const [products, setProducts] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <div className="mt-8">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="bg-gray-200 text-sm px-3 py-1 rounded mb-4"
      >
        {collapsed ? "Show Products" : "Hide Products"}
      </button>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductEditor key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductAdminList;
