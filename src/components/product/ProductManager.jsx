import React, { useEffect, useState } from "react";
import { getDatabase, ref, push, update, remove } from "firebase/database";
import { showToast } from "../../utils/showToast";
import { getCurrentUserRole } from "../../utils/permissions";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

import ProductFormFields from "./ProductFormFields";
import ProductPreview from "./ProductPreview";
import { buildProductPayload } from "../../utils/buildProductPayload";
import ProductToggles from "./ProductToggles";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  FaSave,
  FaPlus,
  FaEye,
  FaTrash,
  FaLock,
  FaArrowLeft,
} from "react-icons/fa";

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
  admin_note: "",
};

const ProductManager = ({ product = null, onRefresh = null }) => {
  const isEditMode = !!product;
  const [formData, setFormData] = useState(
    isEditMode
      ? {
          ...product,
          status: product.status || "available",
          visible: product.visible !== false,
          source: product.source || "Amazon",
          available_from: product.available_from || "Now",
          delivery_options: product.delivery_options || ["Pick Up", "Shipping"],
        }
      : initial
  );

  const [showPreview, setShowPreview] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const navigate = useNavigate();
  const db = getDatabase();

  useEffect(() => {
    async function fetchAccess() {
      try {
        const { isSuperAdmin } = await getCurrentUserRole();
        setIsSuperAdmin(isSuperAdmin);
      } catch (error) {
        console.error("Error fetching user access:", error);
        setIsSuperAdmin(false);
      } finally {
        setLoadingAccess(false);
      }
    }
    fetchAccess();
  }, []);

  usePageTitle({
    prefix: isEditMode ? "Editing Product" : "Adding Product",
    value: formData.title,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      showToast("❌ Product title is required");
      return false;
    }

    if (!formData.price || formData.price <= 0) {
      showToast("❌ Please enter a valid price");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (isEditMode) {
        // Update existing product
        const payload = buildProductPayload(formData, null, false);
        await update(ref(db, `products/${product.id}`), payload);
        showToast("✅ Product updated successfully");
        onRefresh?.();
      } else {
        // Create new product
        const payload = buildProductPayload(formData, user, true);
        await push(ref(db, "products"), payload);
        showToast("✅ Product added successfully");
        setFormData(initial);
      }

      setShowPreview(false);
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("❌ Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${formData.title}"?`
    );
    if (confirmDelete) {
      setLoading(true);
      try {
        await remove(ref(db, `products/${product.id}`));
        showToast("✅ Product deleted successfully");
        navigate("/admin/products");
      } catch (error) {
        console.error("Error deleting product:", error);
        showToast("❌ Failed to delete product");
        setLoading(false);
      }
    }
  };

  if (loadingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading access...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? "Edit Product" : "Add New Product"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditMode
                    ? "Update product details and manage visibility"
                    : "Create a new product listing for your marketplace"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Form Section */}
            <div className="xl:col-span-4 space-y-6">
              {/* Product Form Fields */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 border-b p-4">
                  <h2 className="font-semibold text-gray-900">
                    Product Details
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {isEditMode
                      ? "Edit the product information below"
                      : "Enter the basic product information"}
                  </p>
                </div>
                <div className="p-6">
                  <ProductFormFields
                    formData={formData}
                    setFormData={setFormData}
                    handleChange={handleChange}
                    canEdit={true}
                    isSuperAdmin={isSuperAdmin}
                  />
                </div>
              </div>

              {/* Product Settings */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 border-b p-4">
                  <h2 className="font-semibold text-gray-900">
                    Product Settings
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Configure availability and visibility options
                  </p>
                </div>
                <div className="p-6">
                  <ProductToggles
                    formData={formData}
                    setFormData={setFormData}
                    canEdit={true}
                  />
                </div>
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              {/* Debug Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Debug Info
                </h4>
                <p className="text-sm text-yellow-700">
                  Super Admin Status: {isSuperAdmin ? "✅ True" : "❌ False"}
                </p>
              </div>
              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    {isEditMode ? (
                      <FaSave className="text-sm" />
                    ) : (
                      <FaPlus className="text-sm" />
                    )}
                    {loading
                      ? isEditMode
                        ? "Saving..."
                        : "Adding..."
                      : isEditMode
                      ? "Save Changes"
                      : "Add Product"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <FaEye className="text-sm" />
                    Preview
                  </button>

                  {isEditMode && (
                    <div className="border-t pt-3 mt-4">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        <FaTrash className="text-sm" />
                        Delete Product
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Tips */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tips</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <p>Use high-quality images for better visibility</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <p>Write detailed descriptions to attract buyers</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <p>Set competitive pricing for faster sales</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <p>Preview your product before publishing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

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

export default ProductManager;
