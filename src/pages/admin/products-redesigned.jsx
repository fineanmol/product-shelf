import React, { useState, useEffect, useMemo } from "react";
import { getDatabase, ref, get, update, remove, push } from "firebase/database";
import { FaPlus, FaTh, FaList, FaDownload } from "react-icons/fa";
import DashboardLayout from "../../components/ui/DashboardLayout";
import SearchAndFilter from "../../components/ui/SearchAndFilter";
import ProductCard from "../../components/ui/ProductCard";
import ProductForm from "../../components/ui/ProductForm";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AnimatedButton from "../../components/ui/AnimatedButton";
import { showToast } from "../../utils/showToast";
import {
  getCurrentUserRole,
  filterDataByUserRole,
} from "../../utils/permissions";
import GlassModal from "../../components/ui/GlassModal";
import ProfileImage from "../../components/shared/ProfileImage";

const ProductsRedesigned = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    condition: "",
    category: "",
  });
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Superadmin assignment states
  const [assigningProduct, setAssigningProduct] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const userRoleData = await getCurrentUserRole();
      setUserRole(userRoleData);

      const db = getDatabase();
      const snapshot = await get(ref(db, "products"));

      if (snapshot.exists()) {
        const data = snapshot.val();
        let productsList = Object.entries(data).map(([id, product]) => ({
          id,
          ...product,
        }));

        // Filter products based on user role
        productsList = filterDataByUserRole(
          productsList,
          userRoleData.role,
          userRoleData.user?.uid,
          userRoleData.isSuperAdmin
        );

        setProducts(productsList);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("❌ Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        !filters.status || product.status === filters.status;
      const matchesCondition =
        !filters.condition ||
        (product.condition || product.age || "").toLowerCase() === filters.condition.toLowerCase();
      const matchesCategory =
        !filters.category || product.category === filters.category;

      return matchesSearch && matchesStatus && matchesCondition && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return (b.timestamp || 0) - (a.timestamp || 0);
        case "oldest":
          return (a.timestamp || 0) - (b.timestamp || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, filters, sortBy]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = async (formData) => {
    setFormLoading(true);
    try {
      const db = getDatabase();

      if (editingProduct) {
        // Update existing product
        await update(ref(db, `products/${editingProduct.id}`), {
          ...formData,
          updatedAt: Date.now(),
        });
        showToast("✅ Product updated successfully");
      } else {
        // Create new product
        await push(ref(db, "products"), {
          ...formData,
          added_by: userRole.user?.uid,
          added_email: userRole.user?.email,
          timestamp: Date.now(),
        });
        showToast("✅ Product created successfully");
      }

      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("❌ Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (
      !window.confirm(`Are you sure you want to delete "${product.title}"?`)
    ) {
      return;
    }

    try {
      const db = getDatabase();
      await remove(ref(db, `products/${product.id}`));
      showToast("✅ Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("❌ Failed to delete product");
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const db = getDatabase();
      await update(ref(db, `products/${product.id}`), {
        visible: !product.visible,
        updatedAt: Date.now(),
      });
      showToast(`✅ Product ${product.visible ? "hidden" : "shown"}`);
      fetchProducts();
    } catch (error) {
      console.error("Error updating visibility:", error);
      showToast("❌ Failed to update visibility");
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === "available" ? "reserved" : "available";
    try {
      const db = getDatabase();
      await update(ref(db, `products/${product.id}`), {
        status: newStatus,
        updatedAt: Date.now(),
      });
      showToast(`✅ Product marked as ${newStatus}`);
      fetchProducts();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("❌ Failed to update status");
    }
  };

  const handleAssignUserClick = async (product) => {
    setAssigningProduct(product);
    // Fetch users right before opening to ensure list is fresh
    try {
      const db = getDatabase();
      const snap = await get(ref(db, "users"));
      if (snap.exists()) {
        const data = snap.val() || {};
        const userArray = Object.entries(data).map(([uid, val]) => ({
          uid,
          ...val,
        }));
        setUsers(userArray);
      }
    } catch (error) {
      console.error("Error fetching users for assignment:", error);
      showToast("❌ Failed to refresh users list");
    }
  };

  const handleSelectAssignee = async (user) => {
    if (!assigningProduct) return;
    try {
      const db = getDatabase();
      await update(ref(db, `products/${assigningProduct.id}`), {
        added_by: user.uid,
        added_email: user.email,
        updatedAt: Date.now(),
      });
      showToast(`✅ Assigned to ${user.name || user.email}`);
      setAssigningProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error assigning product:", error);
      showToast("❌ Failed to assign product");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: "", condition: "", category: "" });
    setSearchTerm("");
  };

  const handleExport = () => {
    const csvContent = [
      ["Title", "Price", "Status", "Condition", "Created"].join(","),
      ...filteredAndSortedProducts.map((product) =>
        [
          `"${product.title}"`,
          product.price || "",
          product.status || "",
          product.condition || product.age || "",
          product.timestamp
            ? new Date(product.timestamp).toLocaleDateString()
            : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("✅ Products exported successfully");
  };

  const actions = (
    <div className="flex items-center gap-3">
      <AnimatedButton variant="secondary" size="sm" onClick={handleExport}>
        <FaDownload />
        Export
      </AnimatedButton>

      <div
        className="flex items-center gap-1 p-1 rounded-lg"
        style={{ background: "var(--bg-glass)" }}
      >
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-md transition-all ${
            viewMode === "grid"
              ? "bg-brand-sky text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaTh />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-md transition-all ${
            viewMode === "list"
              ? "bg-brand-sky text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaList />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout
        title="Products"
        subtitle="Manage your product inventory"
      >
        <LoadingSpinner text="Loading products..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Products"
      subtitle={`${filteredAndSortedProducts.length} of ${products.length} products`}
      actions={actions}
      showAddButton={true}
      onAddClick={handleAddProduct}
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
        />

        {/* Products Grid/List */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              No products found
            </h3>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              {products.length === 0
                ? "Start by adding your first product"
                : "Try adjusting your search or filters"}
            </p>
            {products.length === 0 && (
              <AnimatedButton variant="primary" onClick={handleAddProduct}>
                <FaPlus />
                Add Your First Product
              </AnimatedButton>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleVisibility={handleToggleVisibility}
                onToggleStatus={handleToggleStatus}
                canEdit={true}
                isSuperAdmin={userRole?.isSuperAdmin}
                onAssignUser={handleAssignUserClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductForm
        product={editingProduct}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        loading={formLoading}
      />

      {/* Assign Product Modal */}
      <GlassModal
        isOpen={!!assigningProduct}
        onClose={() => {
          setAssigningProduct(null);
          setUserSearchTerm("");
        }}
        title={`Assign Product: "${assigningProduct?.title}"`}
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Select a seller to assign this product to. Once assigned, this product will appear in their dashboard and list of items.
          </p>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky focus:border-transparent transition-all text-sm"
            />
          </div>

          {/* User List */}
          <div className="max-h-[300px] overflow-y-auto border rounded-lg divide-y bg-white">
            {users
              .filter(
                (u) =>
                  (u.name || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  (u.email || "").toLowerCase().includes(userSearchTerm.toLowerCase())
              )
              .map((u) => {
                const isCurrentOwner = assigningProduct?.added_by === u.uid;
                return (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ProfileImage
                        src={u.photoURL}
                        alt={u.name || "User"}
                        className="w-9 h-9 rounded-full object-cover"
                        size={64}
                      />
                      <div>
                        <p className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                          {u.name || "User"}
                          {u.role === "superadmin" && (
                            <span className="text-[10px] bg-brand-sunshine/20 text-brand-navy font-bold px-1.5 py-0.5 rounded border border-brand-sunshine/30">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectAssignee(u)}
                      disabled={isCurrentOwner}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isCurrentOwner
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-brand-sky hover:bg-brand-navy text-white shadow-sm"
                      }`}
                    >
                      {isCurrentOwner ? "Current Owner" : "Assign"}
                    </button>
                  </div>
                );
              })}
            {users.filter(
              (u) =>
                (u.name || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                (u.email || "").toLowerCase().includes(userSearchTerm.toLowerCase())
            ).length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">
                No users matched your search criteria.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => {
                setAssigningProduct(null);
                setUserSearchTerm("");
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </GlassModal>
    </DashboardLayout>
  );
};

export default ProductsRedesigned;
