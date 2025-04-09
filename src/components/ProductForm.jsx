// src/components/ProductForm.jsx
import React, { useState } from "react";
import { getDatabase, push, ref } from "firebase/database";
import { showToast } from "../utils/showToast";
import { getAuth } from "firebase/auth";

import ProductFormFields from "./forms/ProductFormFields";
import ProductPreview from "./forms/ProductPreview";
import ToggleSwitch from "./forms/ToggleSwitch";
import DeliveryOptions from "./forms/DeliveryOptions";

const initial = {
  title: "",
  description: "",
  image: "",
  price: "",
  original_price: "",
  discount: 20,
  status: "available",
  visible: true,
  source: "Amazon",
  available_from: "Now",
  currency: "EUR",
  url: "",
  delivery_options: ["Pick Up", "Shipping"],
};

const ProductForm = () => {
  const [formData, setFormData] = useState(initial);
  const [showPreview, setShowPreview] = useState(false);
  const db = getDatabase();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      original_price: formData.original_price
        ? parseFloat(formData.original_price)
        : undefined,
      currency: formData.currency || "EUR",
      added_by: user?.uid || "unknown",
      timestamp: Date.now(),
    };

    await push(ref(db, "/"), payload);
    showToast("Product added ✅");
    setFormData(initial);
    setShowPreview(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border p-4 rounded shadow bg-white space-y-4 text-left"
    >
      <ProductFormFields
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        canEdit={true}
      />

      <div className="flex justify-around flex-wrap gap-4">
        <ToggleSwitch
          label="Status"
          status={formData.status}
          checked={formData.status === "available"}
          onChange={() =>
            setFormData((prev) => ({
              ...prev,
              status: prev.status === "available" ? "reserved" : "available",
            }))
          }
        />

        <ToggleSwitch
          label="Visible"
          checked={formData.visible !== false}
          status={formData.visible}
          onChange={() =>
            setFormData((prev) => ({
              ...prev,
              visible: !prev.visible,
            }))
          }
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
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Add Product
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600"
        >
          Preview Before Submit
        </button>
      </div>

      {showPreview && (
        <ProductPreview
          formData={formData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </form>
  );
};

export default ProductForm;
