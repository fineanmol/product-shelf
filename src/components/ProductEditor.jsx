import React, { useEffect, useState } from "react";
import { getDatabase, ref, update, remove } from "firebase/database";
import { showToast } from "../utils/showToast";
import { getUserAccess } from "../utils/permissions";

import ProductFormFields from "./forms/ProductFormFields";
import ProductPreview from "./forms/ProductPreview";
import DeliveryOptions from "./forms/DeliveryOptions";
import { buildProductPayload } from "../utils/buildProductPayload";
import ProductToggles from "./forms/ProductToggles";

const ProductEditor = ({ product }) => {
  const [access, setAccess] = useState({});
  const [formData, setFormData] = useState({
    ...product,
    status: product.status || "available",
    visible: product.visible !== false,
    source: product.source || "Amazon",
    available_from: product.available_from || "Now",
    delivery_options: product.delivery_options || ["Pick Up", "Shipping"],
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const resolveAccess = async () => {
      const accessResult = await getUserAccess(product);
      setAccess(accessResult);
    };

    resolveAccess();
  }, [product]);

  const { canEdit, isSuperAdmin } = access;

  const handleChange = (e) => {
    if (!canEdit) {
      showToast("❌ You are not allowed to edit this product.");
      return;
    }

    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!canEdit) {
      showToast("❌ You are not allowed to edit this product.");
      return;
    }
    const payload = buildProductPayload(formData, null, false);
    update(ref(getDatabase(), `products/${product.id}`), payload);
    showToast("Product saved ✅");
    setShowPreview(false);
  };

  const handleDelete = async () => {
    if (!canEdit) {
      showToast("❌ You are not allowed to delete this product.");
      return;
    }

    const confirmDelete = window.confirm(`Delete product "${formData.title}"?`);
    if (confirmDelete) {
      await remove(ref(getDatabase(), `products/${product.id}`));
      showToast("Product deleted 🗑️");
    }
  };

  return (
    <div className="border p-4 rounded shadow bg-white space-y-4 text-left">
      <ProductFormFields
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        canEdit={canEdit}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="flex justify-around flex-wrap gap-4">
        <ProductToggles
          formData={formData}
          setFormData={setFormData}
          canEdit={canEdit}
        />
      </div>

      <DeliveryOptions
        selected={formData.delivery_options}
        setSelected={(options) =>
          setFormData((prev) => ({
            ...prev,
            delivery_options: options,
          }))
        }
        canEdit={canEdit}
      />

      {canEdit ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Publish Changes
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600"
            >
              Preview Before Submit
            </button>
          </div>

          <button
            onClick={handleDelete}
            className="w-full bg-red-500 text-white py-1 rounded mt-2 text-sm hover:bg-red-600"
          >
            Delete Product
          </button>
        </>
      ) : (
        <div className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2 rounded text-center mt-4">
          🔒 You have read-only access to this product.
        </div>
      )}

      {showPreview && (
        <ProductPreview
          formData={formData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default ProductEditor;
