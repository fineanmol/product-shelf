// src/components/forms/ProductToggles.jsx
import React from "react";
import ToggleSwitch from "./ToggleSwitch";

const ProductToggles = ({ formData, setFormData, canEdit }) => (
  <div className="flex justify-around flex-wrap gap-4">
    <ToggleSwitch
      label="Status"
      checked={formData.status === "available"}
      onChange={() =>
        setFormData((prev) => ({
          ...prev,
          status: prev.status === "available" ? "reserved" : "available",
        }))
      }
      disabled={!canEdit}
    />

    <ToggleSwitch
      label="Visible"
      checked={formData.visible !== false}
      onChange={() =>
        setFormData((prev) => ({
          ...prev,
          visible: !prev.visible,
        }))
      }
      disabled={!canEdit}
    />
  </div>
);

export default ProductToggles;
