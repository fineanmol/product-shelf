import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

// Removable-pill tag input (type + Enter to add, click x to remove).
// No equivalent primitive exists in src/components/ui/ today, so this is
// scoped to the stylist module rather than a shared ui/ component.
const TagInput = ({ label, values = [], onChange, placeholder, options = [] }) => {
  const [draft, setDraft] = useState("");

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const removeTag = (tag) => {
    onChange(values.filter((v) => v !== tag));
  };

  return (
    <div>
      {label && (
        <label className="block text-body font-medium text-brand-navy mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-brand-sky/20 text-brand-sky-text px-3 py-1 rounded-full text-caption font-semibold"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="hover:text-brand-coral transition-colors"
            >
              <FaTimes className="text-xs" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        list={options.length ? `${label}-options` : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag(draft);
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-body border border-stone-200 bg-white text-brand-navy rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky"
      />
      {options.length > 0 && (
        <datalist id={`${label}-options`}>
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      )}
    </div>
  );
};

export default TagInput;
