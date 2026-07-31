import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaTrash } from "react-icons/fa";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AnimatedButton from "../../components/ui/AnimatedButton";
import { getSavedBoards, deleteBoard } from "../../services/stylistService";
import { getProduct } from "../../services/productsService";
import { showToast } from "../../utils/showToast";

// Lightweight "moodboard" gallery (open-ai-stylist reference's saved-looks
// concept), listing outfits the user favorited from Results.jsx.
const SavedBoards = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(undefined);
  const [boards, setBoards] = useState([]);
  const [products, setProducts] = useState({});
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

    const loadBoards = async () => {
      setLoading(true);
      try {
        const fetchedBoards = await getSavedBoards(currentUser.uid);
        setBoards(fetchedBoards);

        const ids = [...new Set(fetchedBoards.flatMap((b) => b.productIds || []))];
        const fetchedProducts = await Promise.all(ids.map((id) => getProduct(id)));
        setProducts(
          Object.fromEntries(fetchedProducts.filter(Boolean).map((p) => [p.id, p]))
        );
      } catch (err) {
        console.error("Failed to load saved boards:", err);
        showToast("Could not load your saved boards.");
      }
      setLoading(false);
    };
    loadBoards();
  }, [currentUser, navigate]);

  const handleDelete = async (boardId) => {
    try {
      await deleteBoard(currentUser.uid, boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      showToast("Removed from saved boards.");
    } catch (err) {
      console.error("Failed to delete board:", err);
      showToast("Could not remove this board. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader siteName="SkyMarket" showSearch={false} currentUser={currentUser || null} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-display text-brand-navy mb-6">Saved Looks</h1>

        {loading && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8">
            <LoadingSpinner text="Loading your saved looks..." />
          </div>
        )}

        {!loading && boards.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8 text-center">
            <p className="text-body text-stone-700 mb-4">
              You haven't saved any outfits yet.
            </p>
            <AnimatedButton variant="primary" onClick={() => navigate("/stylist")}>
              Find outfits
            </AnimatedButton>
          </div>
        )}

        {!loading && boards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => {
              const items = (board.productIds || []).map((id) => products[id]).filter(Boolean);
              return (
                <div key={board.id} className="bg-white border border-stone-200 rounded-xl shadow-soft p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-title text-brand-navy">{board.title}</h3>
                    <button
                      onClick={() => handleDelete(board.id)}
                      aria-label={`Remove ${board.title} from saved boards`}
                      className="text-stone-400 hover:text-brand-coral transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {items.map((item) => (
                      <div key={item.id} className="aspect-square bg-stone-50 rounded-lg overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                  {board.rationale && (
                    <p className="text-caption text-stone-500 italic">"{board.rationale}"</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedBoards;
