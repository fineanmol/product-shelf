// scripts/upgrade-bulk-actions.js
// Upgrades products-redesigned.jsx with:
// 1. Custom confirm modal (replaces window.confirm)
// 2. New bulk actions: Mark Sold Out, Unmark Sold Out, Export Selected
// 3. ESC key to deselect all
// 4. Improved bulk action bar

const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/products-redesigned.jsx', 'utf8');

// ── 1. Add BulkActionConfirmModal import ──────────────────────────────────────
c = c.replace(
  `import ProductCard from "../../components/ui/ProductCard";`,
  `import ProductCard from "../../components/ui/ProductCard";
import BulkActionConfirmModal from "../../components/admin/BulkActionConfirmModal";`
);

// ── 2. Add pendingBulkAction state after bulkLoading ──────────────────────────
c = c.replace(
  `  const [bulkLoading, setBulkLoading] = useState(false);`,
  `  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState(null); // { type, handler }`
);

// ── 3. Replace all bulk handlers with modal-based versions ───────────────────
const OLD_BULK_HANDLERS = `  // ── Bulk action handlers ────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!window.confirm(\`Delete \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.\`)) return;
    setBulkLoading(true);
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => remove(ref(db, \`products/\${id}\`))));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} deleted\`);
    setSelectedIds(new Set());
    setBulkLoading(false);
    fetchProducts();
  };

  const handleBulkHide = async () => {
    setBulkLoading(true);
    const db = getDatabase();
    await Promise.allSettled(
      [...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { visible: false, updatedAt: Date.now() }))
    );
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} hidden\`);
    setSelectedIds(new Set());
    setBulkLoading(false);
    fetchProducts();
  };

  const handleBulkShow = async () => {
    setBulkLoading(true);
    const db = getDatabase();
    await Promise.allSettled(
      [...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { visible: true, updatedAt: Date.now() }))
    );
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} made visible\`);
    setSelectedIds(new Set());
    setBulkLoading(false);
    fetchProducts();
  };

  const handleBulkMarkAvailable = async () => {
    setBulkLoading(true);
    const db = getDatabase();
    await Promise.allSettled(
      [...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { status: 'available', updatedAt: Date.now() }))
    );
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} marked available\`);
    setSelectedIds(new Set());
    setBulkLoading(false);
    fetchProducts();
  };

  const handleBulkMarkReserved = async () => {
    setBulkLoading(true);
    const db = getDatabase();
    await Promise.allSettled(
      [...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { status: 'reserved', updatedAt: Date.now() }))
    );
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} marked reserved\`);
    setSelectedIds(new Set());
    setBulkLoading(false);
    fetchProducts();
  };`;

const NEW_BULK_HANDLERS = `  // ── Bulk action helpers ──────────────────────────────────────────────────────
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
    await Promise.allSettled([...selectedIds].map((id) => remove(ref(db, \`products/\${id}\`))));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} deleted\`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkHide = () => confirmBulk('hide', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { visible: false, updatedAt: Date.now() })));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} hidden\`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkShow = () => confirmBulk('show', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { visible: true, updatedAt: Date.now() })));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} made visible\`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkMarkAvailable = () => confirmBulk('available', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { status: 'available', updatedAt: Date.now() })));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} marked available\`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkMarkReserved = () => confirmBulk('reserved', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { status: 'reserved', updatedAt: Date.now() })));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} marked reserved\`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkMarkSoldOut = () => confirmBulk('soldOut', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { sold_out: true, status: 'reserved', updatedAt: Date.now() })));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} marked as sold out\`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleBulkUnmarkSoldOut = () => confirmBulk('unsoldOut', async () => {
    const db = getDatabase();
    await Promise.allSettled([...selectedIds].map((id) => update(ref(db, \`products/\${id}\`), { sold_out: false, status: 'available', updatedAt: Date.now() })));
    showToast(\`✅ \${selectedIds.size} product\${selectedIds.size !== 1 ? 's' : ''} marked as available\`);
    setSelectedIds(new Set());
    fetchProducts();
  });

  const handleExportSelected = () => {
    const rows = filteredAndSortedProducts.filter((p) => selectedIds.has(p.id));
    const csvContent = [
      ["Title", "Price", "Currency", "Status", "Condition", "Category", "Visible", "Sold Out", "URL", "Source", "Created"].join(","),
      ...rows.map((p) => [
        \`"\${(p.title || "").replace(/"/g, '""')}"\`,
        p.price || "",
        p.currency || "EUR",
        p.status || "",
        p.condition || p.age || "",
        p.category || "",
        p.visible !== false ? "true" : "false",
        p.sold_out ? "true" : "false",
        \`"\${p.url || ""}"\`,
        p.source || "",
        p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "",
      ].join(","))
    ].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = \`selected-products-\${new Date().toISOString().split("T")[0]}.csv\`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast(\`✅ \${rows.length} product\${rows.length !== 1 ? 's' : ''} exported\`);
  };`;

const oldIdx = c.indexOf(OLD_BULK_HANDLERS);
if (oldIdx !== -1) {
  c = c.slice(0, oldIdx) + NEW_BULK_HANDLERS + c.slice(oldIdx + OLD_BULK_HANDLERS.length);
  console.log('✅ Replaced bulk handlers');
} else {
  console.log('❌ Could not find OLD_BULK_HANDLERS block');
}

// ── 4. Add useEffect for ESC key deselect ────────────────────────────────────
// Add after the existing useEffect blocks (find the fetchProducts useEffect)
c = c.replace(
  `  // Superadmin assignment states`,
  `  // ESC key to deselect all
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleDeselectAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Superadmin assignment states`
);

// ── 5. Replace the bulk action bar with improved version ─────────────────────
const OLD_BAR = `      {/* Bulk Action Bar — floats at bottom when items are selected */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-brand-navy text-white rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 pr-3 border-r border-white/20">
            <span className="font-bold text-brand-sky text-sm">{selectedIds.size}</span>
            <span className="text-sm text-white/80">selected</span>
            <button onClick={handleDeselectAll} className="ml-1 text-white/50 hover:text-white transition-colors text-xs">x</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkShow} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-50">
              <FaEye /> Show
            </button>
            <button onClick={handleBulkHide} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-50">
              <FaEyeSlash /> Hide
            </button>
            <button onClick={handleBulkMarkAvailable} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-50">
              <FaBoxOpen /> Available
            </button>
            <button onClick={handleBulkMarkReserved} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-50">
              Reserved
            </button>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <button onClick={handleBulkDelete} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
              <FaTrash /> Delete
            </button>
          </div>
          {bulkLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />}
        </div>
      )}
    </DashboardLayout>`;

const NEW_BAR = `      {/* ── Bulk Action Bar ─────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2 px-4 py-3 bg-brand-navy text-white rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md max-w-[95vw]">

          {/* Count + ESC hint */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/20 flex-shrink-0">
            <span className="font-bold text-brand-sky">{selectedIds.size}</span>
            <span className="text-sm text-white/70">selected</span>
            <button onClick={handleDeselectAll} title="Deselect all (Esc)"
              className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white/60 hover:text-white transition-colors text-xs font-bold">
              ✕
            </button>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleBulkShow} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-blue-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40">
              <FaEye className="text-blue-300" /> Show
            </button>
            <button onClick={handleBulkHide} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-gray-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40">
              <FaEyeSlash className="text-gray-300" /> Hide
            </button>
          </div>

          <div className="w-px h-5 bg-white/20" />

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleBulkMarkAvailable} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-green-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40">
              <FaBoxOpen className="text-green-300" /> Available
            </button>
            <button onClick={handleBulkMarkReserved} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40">
              <span className="text-amber-300">⏸</span> Reserved
            </button>
          </div>

          <div className="w-px h-5 bg-white/20" />

          {/* Sold out */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleBulkMarkSoldOut} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40">
              <FaTimesCircle className="text-red-300" /> Sold Out
            </button>
            <button onClick={handleBulkUnmarkSoldOut} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-green-500/60 text-white text-xs font-medium transition-colors disabled:opacity-40">
              <FaUndo className="text-green-300" /> Unmark
            </button>
          </div>

          <div className="w-px h-5 bg-white/20" />

          {/* Export + Delete */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleExportSelected} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-40">
              <FaDownload className="text-gray-300" /> Export
            </button>
            <button onClick={handleBulkDelete} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold transition-colors disabled:opacity-40">
              <FaTrash /> Delete
            </button>
          </div>

          {bulkLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />}
        </div>
      )}

      {/* ── Bulk Confirm Modal ───────────────────────────────────────────── */}
      {pendingBulkAction && (
        <BulkActionConfirmModal
          action={pendingBulkAction.type}
          products={selectedProducts}
          onConfirm={executePendingAction}
          onCancel={() => setPendingBulkAction(null)}
        />
      )}
    </DashboardLayout>`;

const barIdx = c.indexOf(OLD_BAR);
if (barIdx !== -1) {
  c = c.slice(0, barIdx) + NEW_BAR + c.slice(barIdx + OLD_BAR.length);
  console.log('✅ Replaced bulk action bar');
} else {
  console.log('❌ Could not find OLD_BAR block');
}

// ── 6. Add FaTimesCircle and FaUndo to imports ──────────────────────────────
c = c.replace(
  `import { FaPlus, FaTh, FaList, FaDownload, FaFileImport, FaCheckSquare, FaTrash, FaEye, FaEyeSlash, FaBoxOpen, FaEdit, FaExternalLinkAlt } from "react-icons/fa";`,
  `import { FaPlus, FaTh, FaList, FaDownload, FaFileImport, FaCheckSquare, FaTrash, FaEye, FaEyeSlash, FaBoxOpen, FaEdit, FaExternalLinkAlt, FaTimesCircle, FaUndo } from "react-icons/fa";`
);

fs.writeFileSync('src/pages/admin/products-redesigned.jsx', c);
console.log('Done. Total lines:', c.split('\n').length);
