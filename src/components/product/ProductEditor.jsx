import React, { useEffect, useState } from "react";
import { getDatabase, ref, update, remove } from "firebase/database";
import { showToast } from "../../utils/showToast";
import { getUserAccess } from "../../utils/permissions";
import { useNavigate } from "react-router-dom";

import ProductFormFields from "./ProductFormFields";
import ProductPreview from "./ProductPreview";
import { buildProductPayload } from "../../utils/buildProductPayload";
import ProductToggles from "./ProductToggles";
import { usePageTitle } from "../../hooks/usePageTitle";
import { FaSave, FaEye, FaTrash, FaLock, FaArrowLeft } from "react-icons/fa";

const ProductEditor = ({ product }) => {
  const [access, setAccess] = useState({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ...product,
    status: product.status || "available",
    visible: product.visible !== false,
    source: product.source || "Amazon",
    available_from: product.available_from || "Now",
    delivery_options: product.delivery_options || ["Pick Up", "Shipping"],
  });

  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const resolveAccess = async () => {
      const accessResult = await getUserAccess(product);
      setAccess(accessResult);
    };

    resolveAccess();
  }, [product]);

  usePageTitle({ prefix: "Editing Product", value: formData.title });

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

  const handleSave = async () => {
    if (!canEdit) {
      showToast("❌ You are not allowed to edit this product.");
      return;
    }
    
    setLoading(true);
    try {
      const payload = buildProductPayload(formData, null, false);
      await update(ref(getDatabase(), `products/${product.id}`), payload);
      showToast("✅ Product saved successfully");
      setShowPreview(false);
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("❌ Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      showToast("❌ You are not allowed to delete this product.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${formData.title}"?`);
    if (confirmDelete) {
      setLoading(true);
      try {
        await remove(ref(getDatabase(), `products/${product.id}`));
        showToast("✅ Product deleted successfully");
        navigate("/admin/products");
      } catch (error) {
        console.error("Error deleting product:", error);
        showToast("❌ Failed to delete product");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/products")}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Back to Products"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-gray-600 mt-1">
                  Update product details and manage visibility
                </p>
              </div>
            </div>
            {!canEdit && (
              <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                <FaLock className="text-sm" />
                <span className="text-sm font-medium">Read-only Access</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Form Section */}
          <div className="xl:col-span-4 space-y-6">
            {/* Product Form Fields */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 border-b p-4">
                <h2 className="font-semibold text-gray-900">Product Details</h2>
                <p className="text-gray-600 text-sm">Edit the product information below</p>
              </div>
              <div className="p-6">
                <ProductFormFields
                  formData={formData}
                  setFormData={setFormData}
                  handleChange={handleChange}
                  canEdit={canEdit}
                  isSuperAdmin={isSuperAdmin}
                />
              </div>
            </div>

            {/* Product Settings */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 border-b p-4">
                <h2 className="font-semibold text-gray-900">Product Settings</h2>
                <p className="text-gray-600 text-sm">Configure availability and visibility</p>
              </div>
              <div className="p-6">
                <ProductToggles
                  formData={formData}
                  setFormData={setFormData}
                  canEdit={canEdit}
                />
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              
              {canEdit ? (
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <FaSave className="text-sm" />
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  
                  <button
                    onClick={() => setShowPreview(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <FaEye className="text-sm" />
                    Preview
                  </button>
                  
                  <div className="border-t pt-3 mt-4">
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      <FaTrash className="text-sm" />
                      Delete Product
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <FaLock className="text-yellow-600 text-2xl mx-auto mb-2" />
                  <p className="text-yellow-800 text-sm font-medium">Read-only Access</p>
                  <p className="text-yellow-600 text-xs mt-1">
                    You don't have permission to edit this product
                  </p>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Product Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Product ID:</span>
                  <p className="font-mono text-xs text-gray-700 break-all">{product.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="text-gray-700">
                    {product.timestamp 
                      ? new Date(product.timestamp).toLocaleDateString()
                      : "Unknown"
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <p className="text-gray-700">
                    {product.updatedAt 
                      ? new Date(product.updatedAt).toLocaleDateString()
                      : "Never"
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    formData.status === "available" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {formData.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Visibility:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    formData.visible 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {formData.visible ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <ProductPreview
            formData={formData}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductEditor;
