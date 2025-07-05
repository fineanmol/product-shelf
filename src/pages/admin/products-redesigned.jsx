import React, { useState, useEffect, useMemo } from 'react';
import { getDatabase, ref, get, update, remove, push } from 'firebase/database';
import { FaPlus, FaTh, FaList, FaDownload } from 'react-icons/fa';
import DashboardLayout from '../../components/ui/DashboardLayout';
import SearchAndFilter from '../../components/ui/SearchAndFilter';
import ProductCard from '../../components/ui/ProductCard';
import ProductForm from '../../components/ui/ProductForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { showToast } from '../../utils/showToast';
import { getCurrentUserRole, filterDataByUserRole } from '../../utils/permissions';

const ProductsRedesigned = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    condition: ''
  });
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const userRoleData = await getCurrentUserRole();
      setUserRole(userRoleData);

      const db = getDatabase();
      const snapshot = await get(ref(db, 'products'));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        let productsList = Object.entries(data).map(([id, product]) => ({
          id,
          ...product
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
      console.error('Error fetching products:', error);
      showToast('❌ Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filters.status || product.status === filters.status;
      const matchesCondition = !filters.condition || product.condition === filters.condition;
      
      return matchesSearch && matchesStatus && matchesCondition;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return (b.timestamp || 0) - (a.timestamp || 0);
        case 'oldest':
          return (a.timestamp || 0) - (b.timestamp || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
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
          updatedAt: Date.now()
        });
        showToast('✅ Product updated successfully');
      } else {
        // Create new product
        await push(ref(db, 'products'), {
          ...formData,
          added_by: userRole.user?.uid,
          added_email: userRole.user?.email,
          timestamp: Date.now()
        });
        showToast('✅ Product created successfully');
      }
      
      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('❌ Failed to save product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
      return;
    }

    try {
      const db = getDatabase();
      await remove(ref(db, `products/${product.id}`));
      showToast('✅ Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('❌ Failed to delete product');
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const db = getDatabase();
      await update(ref(db, `products/${product.id}`), {
        visible: !product.visible,
        updatedAt: Date.now()
      });
      showToast(`✅ Product ${product.visible ? 'hidden' : 'shown'}`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating visibility:', error);
      showToast('❌ Failed to update visibility');
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'available' ? 'reserved' : 'available';
    try {
      const db = getDatabase();
      await update(ref(db, `products/${product.id}`), {
        status: newStatus,
        updatedAt: Date.now()
      });
      showToast(`✅ Product marked as ${newStatus}`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('❌ Failed to update status');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: '', condition: '' });
    setSearchTerm('');
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Price', 'Status', 'Condition', 'Created'].join(','),
      ...filteredAndSortedProducts.map(product => [
        `"${product.title}"`,
        product.price || '',
        product.status || '',
        product.condition || '',
        product.timestamp ? new Date(product.timestamp).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('✅ Products exported successfully');
  };

  const actions = (
    <div className="flex items-center gap-3">
      <AnimatedButton
        variant="secondary"
        size="sm"
        onClick={handleExport}
      >
        <FaDownload />
        Export
      </AnimatedButton>
      
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-md transition-all ${
            viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaTh />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-md transition-all ${
            viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaList />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title="Products" subtitle="Manage your product inventory">
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
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No products found
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              {products.length === 0 
                ? "Start by adding your first product"
                : "Try adjusting your search or filters"
              }
            </p>
            {products.length === 0 && (
              <AnimatedButton variant="primary" onClick={handleAddProduct}>
                <FaPlus />
                Add Your First Product
              </AnimatedButton>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredAndSortedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleVisibility={handleToggleVisibility}
                onToggleStatus={handleToggleStatus}
                canEdit={true}
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
    </DashboardLayout>
  );
};

export default ProductsRedesigned;