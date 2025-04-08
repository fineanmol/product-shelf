// src/components/ProductEditor.jsx
import React, { useState } from "react";
import { getDatabase, ref, update, remove } from "firebase/database";
import { showToast } from "../utils/showToast";

const ProductEditor = ({ product }) => {
  const [formData, setFormData] = useState(product);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key) => {
    const updated = { ...formData, [key]: !formData[key] };
    setFormData(updated);
    update(ref(getDatabase(), `/${product.id}`), { [key]: updated[key] });
  };

  const handleSave = () => {
    update(ref(getDatabase(), `/${product.id}`), formData);
      showToast("Product saved ✅");
  };
    
  const handleDelete = async () => {
    const confirm = window.confirm(`Delete product "${formData.title}"?`);
    if (confirm) {
      await remove(ref(getDatabase(), `/${product.id}`));
        showToast("Product deleted 🗑️");
    }
  };

  return (
    <div className="border p-4 rounded shadow bg-white space-y-3">
      <div className="text-sm text-gray-600">{product.id}</div>

      {Object.keys(formData).map((key) => {
        if (key === "status" || key === "visible" || key === "id") return null;
        return (
          <input
            key={key}
            name={key}
            value={formData[key]}
            onChange={handleChange}
            placeholder={key}
            className="w-full p-2 border rounded text-sm"
          />
        );
      })}

      <div className="flex gap-4 mt-2">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={formData.status === "available"}
            onChange={() =>
              handleToggle("status", formData.status === "available" ? "reserved" : "available")
            }
          />
          Available
        </label>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={formData.visible !== false}
            onChange={() => handleToggle("visible")}
          />
          Visible
        </label>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-1 rounded mt-2 text-sm hover:bg-blue-700"
      >
        Save Changes
          </button>
          <button
  onClick={handleDelete}
  className="w-full bg-red-500 text-white py-1 rounded mt-2 text-sm hover:bg-red-600"
>
  Delete Product
</button>

    </div>
  );
};

export default ProductEditor;
