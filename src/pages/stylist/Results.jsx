import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AnimatedButton from "../../components/ui/AnimatedButton";
import StylistTabs from "../../components/stylist/StylistTabs";
import OutfitCard from "../../components/stylist/OutfitCard";
import { getProduct } from "../../services/productsService";
import {
  getStylistRecommendations,
  saveBoard,
} from "../../services/stylistService";
import { showToast } from "../../utils/showToast";
import { detectLocationAndTime } from "../../utils/stylistPhoto";

const OCCASION_OPTIONS = ["work", "wedding", "party", "everyday", "travel", "date night"];

const TABS = [
  { key: "forYou", label: "For You" },
  { key: "weather", label: "Weather" },
  { key: "occasion", label: "Occasion" },
  { key: "wardrobe", label: "Wardrobe" },
];

// Tabbed profile-dashboard-style results page (For You / Weather / Occasion
// / Wardrobe), borrowing the reference repo's FashionSense tab concept but
// rebuilt with product-shelf's own brand tokens. Each tab re-calls the
// getStylistRecommendations Cloud Function with different `context`.
const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz, selfiePhotoUrl, wardrobeItems = [] } = location.state || {};

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("forYou");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [outfitsByTab, setOutfitsByTab] = useState({});
  const [savedOutfitTitles, setSavedOutfitTitles] = useState(new Set());
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASION_OPTIONS[0]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, setCurrentUser);
  }, []);

  useEffect(() => {
    if (!quiz) {
      navigate("/stylist", { replace: true });
    }
  }, [quiz, navigate]);

  const fetchRecommendations = useCallback(
    async (tab) => {
      if (!quiz) return;
      setLoading(true);
      setError(null);
      try {
        let context = {};
        if (tab === "weather") {
          context = await buildWeatherContext();
        } else if (tab === "occasion") {
          context = { occasion: selectedOccasion };
        } else if (tab === "wardrobe") {
          context = { wardrobeItems };
        }

        const result = await getStylistRecommendations(quiz, context);
        setOutfitsByTab((prev) => ({ ...prev, [tab]: result.outfits || [] }));

        // The Cloud Function already resolved candidates server-side against
        // the full catalog; the client only needs to fetch the specific
        // products referenced in its response, via the public products/$id
        // read (products/.read is true for everyone per database.rules.json).
        const ids = new Set((result.outfits || []).flatMap((o) => o.productIds));
        const missingIds = [...ids].filter((id) => !products.some((p) => p.id === id));
        if (missingIds.length > 0) {
          const fetched = await Promise.all(missingIds.map((id) => getProduct(id)));
          setProducts((prev) => [...prev, ...fetched.filter(Boolean)]);
        }
      } catch (err) {
        console.error("Failed to load stylist recommendations:", err);
        setError(err.message || "Could not load recommendations. Please try again.");
      }
      setLoading(false);
    },
    [quiz, selectedOccasion, wardrobeItems, products]
  );

  useEffect(() => {
    if (!outfitsByTab[activeTab]) {
      fetchRecommendations(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "occasion") {
      fetchRecommendations("occasion");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOccasion]);

  const handleSave = async (outfit) => {
    if (!currentUser) {
      showToast("Sign in to save outfits.");
      return;
    }
    try {
      await saveBoard(currentUser.uid, {
        title: outfit.title,
        productIds: outfit.productIds,
        rationale: outfit.rationale,
      });
      setSavedOutfitTitles((prev) => new Set(prev).add(outfit.title));
      showToast("Saved to your boards!");
    } catch (err) {
      console.error("Failed to save outfit:", err);
      showToast("Could not save outfit. Please try again.");
    }
  };

  if (!quiz) return null;

  const outfits = outfitsByTab[activeTab] || [];

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader siteName="SkyMarket" showSearch={false} currentUser={currentUser} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-display text-brand-navy">Your Recommendations</h1>
          <AnimatedButton variant="secondary" size="sm" onClick={() => navigate("/stylist")}>
            Retake quiz
          </AnimatedButton>
        </div>

        <div className="rounded-xl overflow-hidden shadow-soft mb-6">
          <StylistTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "occasion" && (
          <div className="flex gap-2 flex-wrap mb-6">
            {OCCASION_OPTIONS.map((occasion) => (
              <button
                key={occasion}
                onClick={() => setSelectedOccasion(occasion)}
                className={`px-4 py-2 rounded-lg text-body capitalize transition-colors ${
                  selectedOccasion === occasion
                    ? "bg-brand-sky-text text-white"
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                }`}
              >
                {occasion}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8">
            <LoadingSpinner text="Styling your outfits..." />
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8 text-center">
            <p className="text-body text-brand-coral mb-4">{error}</p>
            <AnimatedButton variant="primary" onClick={() => fetchRecommendations(activeTab)}>
              Try again
            </AnimatedButton>
          </div>
        )}

        {!loading && !error && outfits.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8 text-center text-stone-500">
            No outfits found yet for this tab. Try adjusting your preferences in the quiz.
          </div>
        )}

        {!loading && !error && outfits.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.title}
                outfit={outfit}
                products={products}
                userPhotoUrl={selfiePhotoUrl}
                onSave={handleSave}
                isSaved={savedOutfitTitles.has(outfit.title)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// "Person, place, and time" context for the Weather tab: season (by current
// month) + city (free geolocation -> Nominatim reverse-geocode) + time of
// day (device clock) -- see src/utils/stylistPhoto.js's detectLocationAndTime,
// which already degrades gracefully to { city: null } if geolocation is
// denied or the network call fails, so this tab never hard-fails on a
// permissions prompt.
const monthToSeason = (month) => {
  if ([11, 0, 1].includes(month)) return "winter";
  if ([2, 3, 4].includes(month)) return "spring";
  if ([5, 6, 7].includes(month)) return "summer";
  return "autumn";
};

const buildWeatherContext = async () => {
  const { city, timeOfDay } = await detectLocationAndTime();
  return { season: monthToSeason(new Date().getMonth()), city, timeOfDay };
};

export default Results;
