import React, { useState, useEffect, useMemo } from "react";
import { getDatabase, ref, get, update, remove, push } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTh, FaList, FaDownload, FaFileImport, FaCheckSquare, FaTrash, FaEye, FaEyeSlash, FaBoxOpen, FaEdit, FaExternalLinkAlt, FaTimesCircle, FaUndo } from "react-icons/fa";
import DashboardLayout from "../../components/ui/DashboardLayout";
import SearchAndFilter from "../../components/ui/SearchAndFilter";
import ProductCard from "../../components/ui/ProductCard";
import BulkActionConfirmModal from "../../components/admin/BulkActionConfirmModal";
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
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "", condition: "", category: "" });
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState(null); // { type, handler }

  // ESC key to deselect all
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleDeselectAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Bulk selection helpers ──────────────────────────────────────────────────
  const handleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredAndSortedProducts.map((p) => p.id)));
  };

  const handleDeselectAll = () => setSelectedIds(new Set());

  // ── Bulk action helpers ──────────────────────────────────────────────────────
  // Returns the full product objects for currently selected IDs
  const selectedProducts = filteredAndSortedProducts.filter((p) => selectedIds.has(p.id));

  // Opens the custom confirm modal for the given action type
  const confirmBulk = (type, handler) => setPendingBulkAction({ type, handler });

  // Called when the user confirms in the modal
  const executePendingAction = async () => {
    if (!pendingBulkAction) return;
    setPendingBulkAction(null);
    setBulkLoading(true);
    await pendingBulkAction.handler();
    setBulkLoading(false);
  };

  // ── Individual bulk action handlers ─────────────────────────────────────────
  const handleBulkDelete = () => confirmBulk('delete', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => remove(ref(db, `products/${id}`))));
    showToast(`✅ ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} deleted`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkHide = () => confirmBulk('hide', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, `products/${id}`), { visible: false, updatedAt: Date.now() })));
    showToast(`✅ ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} hidden`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkShow = () => confirmBulk('show', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, `products/${id}`), { visible: true, updatedAt: Date.now() })));
    showToast(`✅ ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} made visible`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkMarkAvailable = () => confirmBulk('available', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, `products/${id}`), { status: 'available', updatedAt: Date.now() })));
    showToast(`✅ ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} marked available`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkMarkReserved = () => confirmBulk('reserved', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, `products/${id}`), { status: 'reserved', updatedAt: Date.now() })));
    showToast(`✅ ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} marked reserved`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkMarkSoldOut = () => confirmBulk('soldOut', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, `products/${id}`), { sold_out: true, status: 'reserved', updatedAt: Date.now() })));
    showToast(`✅ ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} marked as sold out`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkUnmarkSoldOut = () => confirmBulk('unsoldOut', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, `products/${id}`), { sold_out: false, status: 'available', updatedAt: Date.now() })));
    showToast(`✅ ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} marked as available`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleExportSelected = () => {
    const rows = filteredAndSortedProducts.filter((p) => selectedIds.has(p.id));
    const csvContent = [
      ["Title", "Price", "Currency", "Status", "Condition", "Category", "Visible", "Sold Out", "URL", "Source", "Created"].join(","),
      ...rows.map((p) => [
        `"${(p.title || "").replace(/"/g, '""')}"`,
        p.price || "",
        p.currency || "EUR",
        p.status || "",
        p.condition || p.age || "",
        p.category || "",
        p.visible !== false ? "true" : "false",
        p.sold_out ? "true" : "false",
        `"${p.url || ""}"`,
        p.source || "",
        p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "",
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected-products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast(`✅ ${rows.length} product${rows.length !== 1 ? 's' : ''} exported`);
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
      {/* Select all / deselect toggle */}
      {filteredAndSortedProducts.length > 0 && (
        <button
          onClick={selectedIds.size === filteredAndSortedProducts.length ? handleDeselectAll : handleSelectAll}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm px-3 py-2 rounded-lg transition-colors"
          title={selectedIds.size === filteredAndSortedProducts.length ? 'Deselect all' : 'Select all'}
        >
          <FaCheckSquare className={selectedIds.size > 0 ? 'text-brand-sky' : 'text-gray-400'} />
          <span className="hidden sm:inline">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : 'Select'}
          </span>
        </button>
      )}

      <button
        onClick={() => navigate("/admin/products/bulk-import")}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm px-3 py-2 rounded-lg transition-colors"
      >
        <FaFileImport className="text-brand-sky" />
        <span className="hidden sm:inline">Bulk Import</span>
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm px-3 py-2 rounded-lg transition-colors"
      >
        <FaDownload className="text-gray-500" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
        <button onClick={() => setViewMode("grid")}
          className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-brand-sky text-white" : "text-gray-600 hover:bg-gray-100"}`}>
          <FaTh />
        </button>
        <button onClick={() => setViewMode("list")}
          className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-brand-sky text-white" : "text-gray-600 hover:bg-gray-100"}`}>
          <FaList />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title="Products" subtitle="Manage your product inventory">
        <LoadingSpinner text="Loading products..." />
  
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2 px-4 py-3 bg-brand-navy text-white rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md max-w-[95vw]">
          <div className="flex items-center gap-2 pr-3 border-r border-white/20 flex-shrink-0">
            <span className="font-bold text-brand-sky">{selectedIds.size}</span>
            <span className="text-sm text-white/70">selected</span>
            <button onClick={handleDeselectAll} title="Deselect all (Esc)" className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white/60 hover:text-white transition-colors text-xs font-bold">x</button>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleBulkShow} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-blue-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40"><FaEye className="text-blue-300" /> Show</button>
            <button onClick={handleBulkHide} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-gray-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40"><FaEyeSlash className="text-gray-300" /> Hide</button>
          </div>
          <div className="w-px h-5 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <button onClick={handleBulkMarkAvailable} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-green-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40"><FaBoxOpen className="text-green-300" /> Available</button>
            <button onClick={handleBulkMarkReserved} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40">Reserved</button>
          </div>
          <div className="w-px h-5 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <button onClick={handleBulkMarkSoldOut} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40"><FaTimesCircle className="text-red-300" /> Sold Out</button>
            <button onClick={handleBulkUnmarkSoldOut} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-green-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40"><FaUndo className="text-green-300" /> Unmark</button>
          </div>
          <div className="w-px h-5 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <button onClick={handleExportSelected} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-40"><FaDownload className="text-gray-300" /> Export</button>
            <button onClick={handleBulkDelete} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold transition-colors disabled:opacity-40"><FaTrash /> Delete</button>
          </div>
          {bulkLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />}
        </div>
      )}

      {pendingBulkAction && (
        <BulkActionConfirmModal
          action={pendingBulkAction.type}
          products={selectedProducts}
          onConfirm={executePendingAction}
          onCancel={() => setPendingBulkAction(null)}
        />
      )}
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
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                selected={selectedIds.has(product.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          /* List / Table View */
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-8">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-sky cursor-pointer"
                      checked={selectedIds.size === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                      onChange={() => selectedIds.size === filteredAndSortedProducts.length ? handleDeselectAll() : handleSelectAll()}
                    />
                  </th>
                  <th className="px-3 py-3 w-14"></th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Product</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Price</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Condition</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Visible</th>
                  {userRole?.isSuperAdmin && <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Owner</th>}
                  <th className="px-3 py-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  const hasUrl = product.url && /^https?:\/\//i.test(product.url);
                  const sym = { EUR: '€', USD: '$', GBP: '£', INR: '₹' };
                  return (
                    <tr key={product.id} className={"transition-colors " + (isSelected ? "bg-blue-50" : "hover:bg-gray-50/60")}>
                      <td className="pl-4 pr-2 py-3">
                        <input type="checkbox" className="rounded border-gray-300 text-brand-sky cursor-pointer"
                          checked={isSelected} onChange={() => handleSelect(product.id)} />
                      </td>
                      <td className="px-3 py-3">
                        <img src={product.image || '/placeholder.png'} alt={product.title}
                          className="w-11 h-11 rounded-lg object-cover border border-gray-200 shadow-sm"
                          onError={(e) => { e.target.src = '/placeholder.png'; }} />
                      </td>
                      <td className="px-3 py-3 max-w-[220px]">
                        <p className="font-semibold text-gray-800 truncate text-sm" title={product.title}>{product.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{product.description || '—'}</p>
                        {hasUrl && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-brand-sky hover:underline mt-0.5">
                            <FaExternalLinkAlt className="text-[8px]" />
                            {product.source ? "View on " + product.source : 'Visit Website'}
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-bold text-brand-navy text-sm">{sym[product.currency] || '€'}{product.price}</span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="block text-xs text-gray-400 line-through">{sym[product.currency] || '€'}{product.original_price}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold " +
                          (product.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                          {product.status === 'available' ? 'Available' : 'Reserved'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{product.age || product.condition || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold " +
                          (product.visible !== false ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}>
                          {product.visible !== false ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      {userRole?.isSuperAdmin && (
                        <td className="px-3 py-3 text-xs text-gray-500 max-w-[120px] truncate" title={product.added_email}>
                          {product.added_email || '—'}
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditProduct(product)} title="Edit"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-sky transition-colors">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleToggleVisibility(product)} title={product.visible !== false ? 'Hide' : 'Show'}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-sky transition-colors">
                            {product.visible !== false ? <FaEyeSlash /> : <FaEye />}
                          </button>
                          <button onClick={() => handleToggleStatus(product)} title="Toggle Status"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-500 transition-colors text-[11px] font-semibold">
                            {product.status === 'available' ? 'Rsv' : 'Avl'}
                          </button>
                          <button onClick={() => handleDeleteProduct(product)} title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
