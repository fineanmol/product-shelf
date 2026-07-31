import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import PageHeader from "../../components/shared/PageHeader";
import AnimatedButton from "../../components/ui/AnimatedButton";
import TagInput from "../../components/stylist/TagInput";
import PhotoUploadStep from "../../components/stylist/PhotoUploadStep";
import { showToast } from "../../utils/showToast";

const GENDER_OPTIONS = ["women", "men", "unisex"];
const STYLE_OPTIONS = ["casual", "formal", "sporty", "streetwear", "classic", "bohemian"];
const OCCASION_OPTIONS = ["work", "wedding", "party", "everyday", "travel", "date night"];
const COLOR_OPTIONS = ["black", "white", "navy", "beige", "red", "green", "pastel"];
const BODY_TYPE_OPTIONS = ["", "hourglass", "pear", "rectangle", "athletic", "apple"];
const MANUAL_SKIN_TONES = ["deep", "rich", "tan", "medium", "light", "fair"];

// 3-step wizard: core preferences (always) -> optional selfie analysis
// (replaces DeepFace skin-tone/age detection) -> optional wardrobe photo
// (replaces image-based wardrobe recommendations). Quiz itself stays usable
// without signing in; only the photo steps require auth since they persist
// to Storage under the user's uid.
const Quiz = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);

  const [gender, setGender] = useState("women");
  const [preferredColors, setPreferredColors] = useState([]);
  const [preferredStyles, setPreferredStyles] = useState([]);
  const [occasionTypes, setOccasionTypes] = useState([]);
  const [maxBudget, setMaxBudget] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [manualSkinTone, setManualSkinTone] = useState("");

  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState(null);
  const [selfieAnalysis, setSelfieAnalysis] = useState(null);
  const [wardrobeItems, setWardrobeItems] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, setCurrentUser);
  }, []);

  const handleSubmit = () => {
    const quiz = {
      gender,
      preferredColors,
      preferredStyles,
      occasionTypes,
      maxBudget: maxBudget ? Number(maxBudget) : null,
      bodyType: bodyType || null,
      skinTone: selfieAnalysis?.skinTone || manualSkinTone || null,
    };
    navigate("/stylist/results", {
      state: {
        quiz,
        selfiePhotoUrl,
        wardrobeItems,
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader siteName="SkyMarket" showSearch={false} currentUser={currentUser} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-display text-brand-navy mb-2">Find Your Style</h1>
        <p className="text-body-lg text-stone-700 mb-8">
          A few quick questions and we'll put together outfits from SkyMarket's catalog, just for you.
        </p>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-brand-sky" : "bg-stone-200"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-6 space-y-6">
            <div>
              <label className="block text-body font-medium text-brand-navy mb-2">Who's this for?</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setGender(opt)}
                    className={`px-4 py-2 rounded-lg text-body capitalize transition-colors ${
                      gender === opt
                        ? "bg-brand-sky-text text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <TagInput
              label="Preferred colors"
              values={preferredColors}
              onChange={setPreferredColors}
              placeholder="Type a color and press Enter"
              options={COLOR_OPTIONS}
            />

            <TagInput
              label="Preferred styles"
              values={preferredStyles}
              onChange={setPreferredStyles}
              placeholder="e.g. casual, formal"
              options={STYLE_OPTIONS}
            />

            <TagInput
              label="Occasions"
              values={occasionTypes}
              onChange={setOccasionTypes}
              placeholder="e.g. work, wedding"
              options={OCCASION_OPTIONS}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body font-medium text-brand-navy mb-2">Max budget</label>
                <input
                  type="number"
                  min="0"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full px-4 py-2.5 text-body border border-stone-200 bg-white text-brand-navy rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-brand-navy mb-2">Body type (optional)</label>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  className="w-full px-4 py-2.5 text-body border border-stone-200 bg-white text-brand-navy rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky"
                >
                  {BODY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt || "Prefer not to say"}</option>
                  ))}
                </select>
              </div>
            </div>

            <AnimatedButton variant="primary" size="lg" className="w-full" onClick={() => setStep(2)}>
              Continue
            </AnimatedButton>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {currentUser ? (
              <PhotoUploadStep
                uid={currentUser.uid}
                kind="selfie"
                label="Add a selfie (optional)"
                helperText="We'll use Gemini to estimate skin tone and style for better matches. Nothing is shared publicly."
                onAnalyzed={({ photoUrl, analysis }) => {
                  setSelfiePhotoUrl(photoUrl);
                  setSelfieAnalysis(analysis);
                  showToast("Photo analyzed!");
                }}
                onSkip={() => setStep(3)}
              />
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-6">
                <p className="text-body text-stone-700 mb-4">
                  Sign in to add a selfie for skin-tone matching and virtual try-on, or continue without one.
                </p>
                <div>
                  <label className="block text-body font-medium text-brand-navy mb-2">
                    Or pick your skin tone manually
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {MANUAL_SKIN_TONES.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setManualSkinTone(tone)}
                        className={`px-3 py-1.5 rounded-full text-caption capitalize transition-colors ${
                          manualSkinTone === tone
                            ? "bg-brand-sky-text text-white"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <AnimatedButton variant="secondary" onClick={() => setStep(1)}>Back</AnimatedButton>
              <AnimatedButton variant="primary" className="flex-1" onClick={() => setStep(3)}>Continue</AnimatedButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {currentUser ? (
              <PhotoUploadStep
                uid={currentUser.uid}
                kind="wardrobe"
                label="Add an item from your wardrobe (optional)"
                helperText="We'll tag its category, color, and style so it can be mixed into your recommendations."
                onAnalyzed={({ photoUrl, analysis }) => {
                  setWardrobeItems((prev) => [...prev, { photoUrl, ...analysis }]);
                  showToast("Wardrobe item added!");
                }}
                onSkip={handleSubmit}
              />
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-6">
                <p className="text-body text-stone-700">
                  Sign in to mix your own wardrobe photos into your recommendations, or see your results now.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <AnimatedButton variant="secondary" onClick={() => setStep(2)}>Back</AnimatedButton>
              <AnimatedButton variant="primary" className="flex-1" onClick={handleSubmit}>
                See my recommendations
              </AnimatedButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Quiz;
