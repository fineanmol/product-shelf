import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaTrash, FaCheck, FaPen } from "react-icons/fa";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AnimatedButton from "../../components/ui/AnimatedButton";
import TagInput from "../../components/stylist/TagInput";
import PhotoUploadStep from "../../components/stylist/PhotoUploadStep";
import {
  getWardrobeItems,
  updateWardrobeItem,
  deleteWardrobeItem,
  saveWardrobeItem,
} from "../../services/stylistService";
import { showToast } from "../../utils/showToast";

const CATEGORY_OPTIONS = ["top", "bottom", "dress", "footwear", "accessory", "outerwear"];

// One wardrobe item card: shows the photo + Gemini's AI-generated notes
// (category/colors/styleTags) as editable fields, so a wrong guess from the
// vision model can be corrected by the user rather than silently mismapping
// future outfit recommendations. Edits are saved explicitly (not on every
// keystroke) via the pencil -> checkmark toggle.
const WardrobeCard = ({ item, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(item.category || "");
  const [colors, setColors] = useState(item.colors || []);
  const [styleTags, setStyleTags] = useState(item.styleTags || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id, { category, colors, styleTags });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-5">
      <div className="aspect-square bg-stone-50 rounded-lg overflow-hidden mb-4">
        <img src={item.photoUrl} alt={category || "Wardrobe item"} className="w-full h-full object-contain" />
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-caption font-medium text-brand-navy mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-body border border-stone-200 bg-white text-brand-navy rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky"
            >
              <option value="">Unspecified</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <TagInput label="Colors" values={colors} onChange={setColors} placeholder="Add a color" />
          <TagInput label="Style tags" values={styleTags} onChange={setStyleTags} placeholder="Add a style tag" />
          <div className="flex gap-2">
            <AnimatedButton variant="primary" size="sm" onClick={handleSave} loading={saving}>
              <FaCheck className="mr-1.5" /> Save
            </AnimatedButton>
            <AnimatedButton variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </AnimatedButton>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-body font-medium text-brand-navy capitalize">
            {item.category || "Uncategorized"}
          </p>
          {item.colors?.length > 0 && (
            <p className="text-caption text-stone-500">Colors: {item.colors.join(", ")}</p>
          )}
          {item.styleTags?.length > 0 && (
            <p className="text-caption text-stone-500">Style: {item.styleTags.join(", ")}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit AI-generated notes for this item"
              className="text-stone-400 hover:text-brand-sky-text transition-colors"
            >
              <FaPen />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              aria-label="Delete this wardrobe item"
              className="text-stone-400 hover:text-brand-coral transition-colors"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Management page for a shopper's persisted wardrobe: view/edit/delete every
// uploaded item (photo + AI-generated category/colors/style notes), add
// more items, and jump into the existing outfit-generation flow using the
// full saved wardrobe instead of only the current quiz session's uploads.
const Wardrobe = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(undefined);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, setCurrentUser);
  }, []);

  useEffect(() => {
    if (currentUser === undefined) return;
    if (currentUser === null) {
      navigate("/login");
      return;
    }

    const loadItems = async () => {
      setLoading(true);
      try {
        setItems(await getWardrobeItems(currentUser.uid));
      } catch (err) {
        console.error("Failed to load wardrobe items:", err);
        showToast("Could not load your wardrobe.");
      }
      setLoading(false);
    };
    loadItems();
  }, [currentUser, navigate]);

  const handleSaveEdit = async (itemId, patch) => {
    try {
      await updateWardrobeItem(currentUser.uid, itemId, patch);
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)));
      showToast("Updated!");
    } catch (err) {
      console.error("Failed to update wardrobe item:", err);
      showToast("Could not save your changes. Please try again.");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Remove this item from your wardrobe?")) return;
    try {
      await deleteWardrobeItem(currentUser.uid, itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      showToast("Removed from your wardrobe.");
    } catch (err) {
      console.error("Failed to delete wardrobe item:", err);
      showToast("Could not remove this item. Please try again.");
    }
  };

  const handleUploaded = async ({ photoUrl, analysis }) => {
    const item = { photoUrl, ...analysis };
    try {
      const id = await saveWardrobeItem(currentUser.uid, item);
      setItems((prev) => [...prev, { id, ...item, createdAt: Date.now() }]);
      showToast("Added to your wardrobe!");
    } catch (err) {
      console.error("Failed to save wardrobe item:", err);
      showToast("Item analyzed, but couldn't be saved.");
    }
  };

  // Jumps straight to the results page's Wardrobe tab, seeded with every
  // saved item -- this is the "generate multiple combinations from my
  // photos" flow, without requiring a fresh quiz run each time.
  const handleGenerateOutfits = () => {
    navigate("/stylist/results", {
      state: {
        quiz: { gender: "unisex" },
        wardrobeItems: items,
        initialTab: "wardrobe",
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader siteName="SkyMarket" showSearch={false} currentUser={currentUser || null} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-display text-brand-navy">Your Wardrobe</h1>
          {items.length > 0 && (
            <AnimatedButton variant="primary" size="sm" onClick={handleGenerateOutfits}>
              Generate outfits from my wardrobe
            </AnimatedButton>
          )}
        </div>

        <div className="mb-8">
          <PhotoUploadStep
            uid={currentUser?.uid}
            kind="wardrobe"
            multiple
            label="Add more items"
            helperText="Select as many photos as you like at once."
            onAnalyzed={handleUploaded}
            skippable={false}
          />
        </div>

        {loading && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8">
            <LoadingSpinner text="Loading your wardrobe..." />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8 text-center text-stone-500">
            No items yet — upload a photo above to get started.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <WardrobeCard key={item.id} item={item} onSave={handleSaveEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wardrobe;
