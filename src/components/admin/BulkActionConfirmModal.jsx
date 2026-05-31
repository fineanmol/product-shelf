// src/components/admin/BulkActionConfirmModal.jsx
import React from "react";
import { FaTrash, FaEye, FaEyeSlash, FaBoxOpen, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

const ACTION_CONFIG = {
  delete:     { color: "red",    icon: <FaTrash />,      label: "Delete",         verb: "permanently deleted" },
  hide:       { color: "gray",   icon: <FaEyeSlash />,   label: "Hide",           verb: "hidden from the public" },
  show:       { color: "blue",   icon: <FaEye />,        label: "Show",           verb: "made visible to the public" },
  available:  { color: "green",  icon: <FaBoxOpen />,    label: "Mark Available", verb: "marked as Available" },
  reserved:   { color: "amber",  icon: <FaBoxOpen />,    label: "Mark Reserved",  verb: "marked as Reserved" },
  soldOut:    { color: "red",    icon: <FaTimesCircle />,label: "Mark Sold Out",  verb: "marked as Sold Out" },
  unsoldOut:  { color: "green",  icon: <FaBoxOpen />,    label: "Unmark Sold Out",verb: "unmarked as Sold Out" },
};

const COLOR_MAP = {
  red:   { header: "bg-red-50 border-red-200",   icon: "text-red-500",   btn: "bg-red-500 hover:bg-red-600 text-white" },
  gray:  { header: "bg-gray-50 border-gray-200", icon: "text-gray-500",  btn: "bg-gray-600 hover:bg-gray-700 text-white" },
  blue:  { header: "bg-blue-50 border-blue-200", icon: "text-blue-500",  btn: "bg-blue-500 hover:bg-blue-600 text-white" },
  green: { header: "bg-green-50 border-green-200",icon:"text-green-500", btn: "bg-green-500 hover:bg-green-600 text-white" },
  amber: { header: "bg-amber-50 border-amber-200",icon:"text-amber-500", btn: "bg-amber-500 hover:bg-amber-600 text-white" },
};

export default function BulkActionConfirmModal({ action, products, onConfirm, onCancel }) {
  if (!action || !products?.length) return null;

  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.delete;
  const colors = COLOR_MAP[cfg.color] || COLOR_MAP.red;
  const isDestructive = cfg.color === "red";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

        {/* Header */}
        <div className={`flex items-start gap-4 p-5 border-b ${colors.header}`}>
          <div className={`text-2xl mt-0.5 flex-shrink-0 ${colors.icon}`}>
            {isDestructive ? <FaExclamationTriangle /> : cfg.icon}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">
              {cfg.label} {products.length} product{products.length !== 1 ? "s" : ""}?
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {products.length === 1
                ? `"${products[0].title}" will be ${cfg.verb}.`
                : `These ${products.length} products will be ${cfg.verb}.`}
              {isDestructive && " This cannot be undone."}
            </p>
          </div>
        </div>

        {/* Product list */}
        <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-2.5">
              <img
                src={p.image || "/placeholder.png"}
                alt={p.title}
                className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                onError={(e) => { e.target.src = "/placeholder.png"; }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                <p className="text-xs text-gray-400">
                  {p.currency || "€"}{p.price} · {p.status || "available"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-white">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${colors.btn}`}
          >
            {cfg.icon}
            {cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
}
