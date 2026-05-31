const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/products-redesigned.jsx', 'utf8');

// ── Fix 1: Clean up the broken loading block ──────────────────────────────────
// The bulk bar was injected inside the loading return by mistake — strip it out
const loadingBrokenStart = `  if (loading) {
    return (
      <DashboardLayout
        title="Products"
        subtitle="Manage your product inventory"
      >
        <LoadingSpinner text="Loading products..." />
  
      {/* Bulk Action Bar — floats at bottom when items are selected */}`;

const loadingBrokenEnd = `    </DashboardLayout>
    );
  }`;

const brokenIdx = c.indexOf(loadingBrokenStart);
const brokenEndIdx = c.indexOf(loadingBrokenEnd, brokenIdx) + loadingBrokenEnd.length;

if (brokenIdx !== -1) {
  const cleanLoading = `  if (loading) {
    return (
      <DashboardLayout title="Products" subtitle="Manage your product inventory">
        <LoadingSpinner text="Loading products..." />
      </DashboardLayout>
    );
  }`;
  c = c.slice(0, brokenIdx) + cleanLoading + c.slice(brokenEndIdx);
  console.log('Fixed loading block');
} else {
  console.log('Loading block already clean or not found');
}

// ── Fix 2: Replace the grid/list render with proper table ──────────────────────
const OLD_RENDER = `        ) : (
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
                selected={selectedIds.has(product.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}`;

const NEW_RENDER = `        ) : viewMode === "grid" ? (
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
                  const hasUrl = product.url && /^https?:\\/\\//i.test(product.url);
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
        )}`;

const oldIdx = c.indexOf(OLD_RENDER);
if (oldIdx !== -1) {
  c = c.slice(0, oldIdx) + NEW_RENDER + c.slice(oldIdx + OLD_RENDER.length);
  console.log('Replaced list view with table');
} else {
  console.log('ERROR: Could not find old render block');
}

// ── Fix 3: Ensure FaExternalLinkAlt and FaEdit are imported ──────────────────
if (!c.includes('FaExternalLinkAlt')) {
  c = c.replace(
    'import { FaPlus, FaTh, FaList, FaDownload, FaFileImport, FaCheckSquare, FaTrash, FaEye, FaEyeSlash, FaBoxOpen } from "react-icons/fa";',
    'import { FaPlus, FaTh, FaList, FaDownload, FaFileImport, FaCheckSquare, FaTrash, FaEye, FaEyeSlash, FaBoxOpen, FaEdit, FaExternalLinkAlt } from "react-icons/fa";'
  );
  console.log('Added FaExternalLinkAlt and FaEdit to imports');
} else {
  console.log('Icons already imported');
}

fs.writeFileSync('src/pages/admin/products-redesigned.jsx', c);
console.log('Done. Total lines:', c.split('\n').length);
