// src/components/product/ProductForm.jsx
import React, { useState, useEffect } from "react";
import { getDatabase, push, ref } from "firebase/database";
import { showToast } from "../../utils/showToast";
import { getAuth } from "firebase/auth";
import { getUserAccess } from "../../utils/permissions";
import { useNavigate } from "react-router-dom";

import ProductFormFields from "./ProductFormFields";
import ProductPreview from "./ProductPreview";
import { buildProductPayload } from "../../utils/buildProductPayload";
import ProductToggles from "./ProductToggles";
import { usePageTitle } from "../../hooks/usePageTitle";
import { FaPlus, FaEye, FaArrowLeft } from "react-icons/fa";

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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const db = getDatabase();

  useEffect(() => {
    async function fetchAccess() {
      try {
        const access = await getUserAccess(formData);
        setIsSuperAdmin(access.isSuperAdmin);
      } catch (error) {
        setIsSuperAdmin(false);
      }
    }
    fetchAccess();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast("❌ Product title is required");
      return;
    }
    
    if (!formData.price || formData.price <= 0) {
      showToast("❌ Please enter a valid price");
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const payload = buildProductPayload(formData, user, true);
      await push(ref(db, "products"), payload);
      showToast("✅ Product added successfully");
      setFormData(initial);
      setShowPreview(false);
      navigate("/admin/products");
    } catch (error) {
      console.error("Error adding product:", error);
      showToast("❌ Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  usePageTitle({ prefix: "Adding Product", value: formData.title });

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
                <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                <p className="text-gray-600 mt-1">
                  Create a new product listing for your marketplace
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
                  <h2 className="font-semibold text-gray-900">Product Details</h2>
                  <p className="text-gray-600 text-sm">Enter the basic product information</p>
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
                  <h2 className="font-semibold text-gray-900">Product Settings</h2>
                  <p className="text-gray-600 text-sm">Configure availability and visibility options</p>
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
              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <FaPlus className="text-sm" />
                    {loading ? "Adding..." : "Add Product"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <FaEye className="text-sm" />
                    Preview
                  </button>
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

              {/* Form Progress */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Form Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Title</span>
                    <span className={`font-medium ${formData.title.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.title.trim() ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Description</span>
                    <span className={`font-medium ${formData.description.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.description.trim() ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Image</span>
                    <span className={`font-medium ${formData.image.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.image.trim() ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price</span>
                    <span className={`font-medium ${formData.price && formData.price > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.price && formData.price > 0 ? '✓' : '○'}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Completion</span>
                    <span>{Math.round(([
                      formData.title.trim(),
                      formData.description.trim(),
                      formData.image.trim(),
                      formData.price && formData.price > 0
                    ].filter(Boolean).length / 4) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${([
                          formData.title.trim(),
                          formData.description.trim(),
                          formData.image.trim(),
                          formData.price && formData.price > 0
                        ].filter(Boolean).length / 4) * 100}%`
                      }}
                    ></div>
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

export default ProductForm;
