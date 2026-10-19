# AI Wardrobe — Prompts

- **Part A** is the build brief for a coding agent (Claude Code). It creates a new app from scratch.
- **Part B** holds the runtime prompts the app sends to the vision/LLM model.

---

## PART A — Build prompt (paste into Claude Code in an empty folder)

Build **"Wardrobe AI"**, a new, modern, production-quality web app. It is a personal AI stylist that knows my entire closet:
- I upload photos of my clothes.
- It cuts them out, tags them, and builds the best outfits for **where I am, the live weather, the date and time, and the occasion**.
- It learns my taste from my own style notes and inspiration photos (**Style DNA**) and from my feedback.

Start by writing an implementation plan (architecture, data model, routes, milestones) and wait for my approval. Then build it milestone by milestone, with small commits.

### 1. Tech stack (use these unless you have a strong reason not to, and say why)
- **Next.js 15 (App Router) + TypeScript (strict)**, React Server Components where they help, Server Actions / Route Handlers for every AI and third-party call, so **no API keys reach the browser**.
- **Tailwind CSS v4 + shadcn/ui (Radix)**, **Framer Motion** for motion, **lucide-react** icons, **next-themes** for dark/light mode.
- **Supabase**:
  - Auth: email magic link + Google.
  - Postgres with **Row Level Security** on every table.
  - Private Storage with signed URLs.
  - `pgvector` reserved for embeddings later.
- **Gemini 2.5 Flash** for vision tagging and stylist reasoning, using **structured output** (`responseMimeType: "application/json"` + `responseSchema`). Put it behind a small `ai/` provider interface so Claude or another model can be swapped in later.
- **Zod** for every schema (DB rows, AI I/O, forms), **TanStack Query** for client data, **react-hook-form**.
- **Background removal:** `@imgly/background-removal` in the browser (WebGPU/WASM, no server cost). Allow a server fallback (remove.bg or a hosted BiRefNet) behind an env flag. Note the AGPL licence of the imgly library in the README for review.
- **Weather/geo:**
  - **Open-Meteo** forecast + geocoding (no key; show the "Weather data by Open-Meteo.com" attribution).
  - Browser Geolocation.
  - Reverse geocoding via Open-Meteo or Nominatim (cached, ≤1 req/s, proper User-Agent).
- **Testing:** Vitest + Testing Library for units, Playwright for 3–4 end-to-end flows. Use ESLint + Prettier.
- Deployable to **Vercel**. Ship `.env.example` and a README with setup steps and a Supabase SQL migration.

### 2. Design direction — "modern, editorial, calm"
- **Feel:** a premium fashion magazine meets a modern app (think Arc / Linear polish with SSENSE / COS editorial calm). Lots of whitespace, big photography, quiet UI.
- **Type:**
  - A characterful serif display font for headings (e.g. *Instrument Serif* or *Fraunces*).
  - A clean grotesk for UI (e.g. *Inter* / *Geist*).
  - A tight type scale.
- **Colour:**
  - Warm off-white base (`#FAF8F5`) and near-black ink (`#141414`), with one accent (e.g. deep olive or clay).
  - A true dark mode with warm charcoal, not pure black.
  - Garment cutouts sit on soft tinted cards so every colour reads well.
- **Components:**
  - Rounded-2xl cards, subtle borders instead of heavy shadows, glassy sticky header, bottom tab bar on mobile, a command palette (⌘K) to search the wardrobe.
  - Skeleton loaders everywhere, plus empty states with friendly illustrations and copy.
- **Motion:**
  - Outfit cards assemble as a **flat-lay** (outerwear, top, bottom, shoes, accessories animating into place).
  - Swipe left/right on mobile to like or skip an outfit.
  - Shared-element transition from a grid item to its detail view.
  - Respect `prefers-reduced-motion`.
- **Mobile-first and installable PWA** (manifest, icons, offline shell). Uploading from the phone camera roll must feel native.
- **Accessibility:** WCAG 2.2 AA, keyboard navigable, visible focus, alt text generated from tags, Lighthouse ≥ 95 in every category.

### 3. Pages and flows
1. **Landing (`/`)**: hero with an animated flat-lay demo, a 3-step "Upload → Learn → Get dressed" explainer, sign-in CTA.
2. **Onboarding (`/onboarding`)**: name, home city (auto-detect + search), how cold you feel (cold tolerance −2..2), usual formality, body/fit preferences (optional), then a nudge to upload ≥ 10 items and import Style DNA.
3. **Today (`/today`)**, the home screen:
   - Location chip (editable).
   - Date and time picker (now → +15 days; morning/afternoon/evening/night or a specific hour).
   - Weather card (icon, temp, feels-like, rain %, wind, UV, day min/max, sunrise/sunset).
   - Occasion chips (work, casual, date, party, formal, interview, wedding guest, gym, travel, outdoors, custom text) and an indoor/outdoor toggle.
   - A big **"Style me"** button.
   - Results: **3–5 outfit cards**, each showing:
     - a flat-lay of my own cutouts
     - a title, a "why it works" line, a weather note and a layering tip
     - a colour-story swatch row
     - a score
   - Card actions: **Wear this**, 👍 / 👎, **Swap** a single slot (re-scored instantly on the client, no AI call), **Save**, **Share as image** (export the flat-lay as PNG).
   - A one-line **day advice** banner (umbrella, sunglasses, bring a layer for later).
4. **Wardrobe (`/wardrobe`)**:
   - Masonry grid of cutouts with filters (category, colour swatches, season, warmth, formality, status, not worn in 30 days) and sort (recent, most worn, least worn, cost per wear).
   - Bulk select → archive / mark as laundry.
   - **Item detail drawer**: big image, editable tags (low-confidence fields highlighted), wear history, price → cost per wear, "outfits with this item".
5. **Upload (`/wardrobe/upload`)**: drag-and-drop or camera roll, **dozens of photos at once**, and a live queue with a status per item:
   1. queued
   2. removing background
   3. tagging
   4. needs review / ready / error + retry

   Process 2–3 at a time. Show the before/after cutout and let me fix the crop/mask. Detect duplicates via perceptual hash and warn.
6. **Style DNA (`/style-dna`)**:
   - Paste or import notes (`.txt`, `.md`, multi-select, or one big paste) and bulk-upload inspiration photos (screenshots, Pinterest saves).
   - The AI extracts a **readable, editable profile**: preferred and avoided colours, silhouettes, style keywords, signature combos, personal rules ("no skinny jeans", "always one statement piece"), cold tolerance, default formality.
   - Show "Learned from N notes / M photos" and any conflicts it found. Re-run on new imports and merge without wiping my manual edits.
7. **Planner (`/planner`)**: week calendar with each day's forecast. Drag saved outfits onto days, or tap "Plan my week" to auto-fill without repeating items too often. **Trip mode**: destination + dates → per-day forecast → a minimal capsule packing list that covers every day.
8. **Saved looks and History (`/looks`, `/history`)**: saved outfits, a worn-outfits timeline, stats (most and least worn, wardrobe colour distribution, category balance, "orphans" that never get styled, and **"one item that would unlock the most new outfits"**).
9. **Settings**: units (°C/°F, km/h/mph), "don't repeat within N days" (default 3), data export (JSON + images ZIP), delete account.

### 4. Data model (Postgres, RLS: `user_id = auth.uid()` on everything)
- `profiles`: id, display_name, home_city, lat, lon, cold_tolerance, formality_default, units, repeat_window_days, onboarding_done.
- `items`:
  - id, user_id, image_path (cutout PNG), thumb_path (WebP), original_path
  - category (`top|bottom|dress|outerwear|shoes|accessory|bag`), subcategory
  - colors `jsonb [{name, hex}]`, pattern, material
  - warmth (1–5), formality (1–5), seasons `text[]`
  - waterproof, windproof, layer_role (`base|mid|outer|none`), fit
  - style_tags `text[]`, confidence `jsonb`
  - status (`active|laundry|archived`), price, wear_count, last_worn_at, phash, created_at, updated_at
  - embedding `vector` (nullable, future)
- `style_sources`: id, user_id, type (`note|photo`), text, image_path, extracted `jsonb`, created_at.
- `style_profile`: user_id PK, preferred_colors, avoid_colors, silhouettes, style_keywords, signature_combos, rules, conflicts, manual_overrides `jsonb`, updated_at.
- `outfits`: id, user_id, item_ids `uuid[]`, title, why, weather_note, layering_tip, color_story, score, context `jsonb`, saved, created_at. Use a stable hash of the sorted item_ids for dedupe.
- `wear_log`: id, user_id, outfit_id?, item_ids, worn_on (date), context `jsonb` (city, feels_like, occasion), rating.
- `feedback`: id, user_id, item_ids, vote (1/−1), reason?, created_at.
- `plans`: id, user_id, date, outfit_id, trip_id?
- `trips`: id, user_id, destination, lat, lon, start_date, end_date.
- Storage bucket `wardrobe` (private): `{user_id}/items/…`, `{user_id}/style/…`. Policies are limited to the owner's folder, with size and MIME limits.

### 5. Intelligence pipeline
1. **Ingest:**
   - Downscale on the client (max 1600 px), then remove the background in the browser.
   - Upload the original, the cutout and a thumbnail.
   - A server action calls the **B1 tagger** with `responseSchema`, validates with Zod and retries once on invalid output.
   - Items with confidence < 0.6 on any key field go to "needs review".
2. **Style DNA:** batch notes plus 6–10 photos per call through the **B2 extractor**. Merge with the existing profile; `manual_overrides` always win.
3. **Context** (`lib/weather.ts`, `lib/context.ts`):
   - Open-Meteo hourly `temperature_2m, apparent_temperature, precipitation_probability, precipitation, wind_speed_10m, wind_gusts_10m, uv_index, weather_code, is_day` and daily `temperature_2m_max/min, sunrise, sunset, precipitation_probability_max`, with `timezone=auto`.
   - Summarize the chosen time slot **and** the whole day span.
   - Cache by (lat/lon rounded to 2 dp, date) for 30 min.
   - Season comes from the month **and the hemisphere**.
4. **Weather → clothing** (pure `lib/weatherToClothing.ts`):
   - Feels-like °C → **targetWarmth** (the sum of item warmth across layers):

     | Feels-like | targetWarmth |
     |---|---|
     | ≥ 27 °C | 2 |
     | 22–26 | 3 |
     | 17–21 | 4–5 |
     | 12–16 | 6–7 |
     | 6–11 | 8–9 |
     | 0–5 | 10–11 |
     | < 0 | 12+ |

     Shift by cold tolerance.
   - Modifiers:
     - rain ≥ 40% → waterproof outer or shoes required; avoid suede and light canvas
     - gusts ≥ 40 km/h → windproof outer; avoid flowy hems
     - UV ≥ 6 → sunglasses or a hat tip
     - day swing ≥ 8 °C → removable layer required
   - Returns `{targetWarmth, requiredFlags, avoidFlags, tips}`.
5. **Outfit engine** (pure `lib/outfitEngine.ts`, deterministic with a seed):
   - **Filter:**
     - active items only
     - formality within ±1 of the occasion
     - weather flags
     - not worn within the repeat window
     - season fit
   - **Generate** from templates `top+bottom+shoes [+mid] [+outer] [+accessory/bag]` and `dress+shoes [+outer] [+accessory/bag]`. Stratified sampling, ≤ 500 combos.
   - **Score 0–100** with an explainable breakdown:
     - warmth fit
     - colour harmony (neutrals pair with anything; analogous/complementary hue; value contrast; ≤ 3 main colours; ≤ 1 loud pattern)
     - formality coherence
     - Style DNA match (colours, keywords, rules as hard or soft constraints)
     - learned pair preferences from likes, dislikes and wears
     - freshness
   - Keep the **top ~20 diverse candidates**: maximal marginal relevance, so the top results don't all share the same top.
6. **AI stylist:**
   - Send the candidates, a compact wardrobe map (ids + short tags, **never image URLs**), the context, the Style DNA and the feedback to **B3**.
   - Validate the output, drop unknown ids, enforce the slot rules.
   - **Fallback:** if the AI fails or times out (20 s), show the rule-ranked top outfits with template-generated reasons. Never show an empty screen.
7. **Learning loop:**
   - 👍/👎 and "Wear this" update pairwise item weights (co-occurrence in liked vs disliked outfits), item wear stats and recency.
   - The next "Style me" visibly changes.

### 6. Quality bar
- Rate-limit AI routes per user (e.g. Upstash or a simple Postgres counter). Handle 429/quota errors with backoff and a friendly toast. Log the token/cost per call in dev.
- Never send other users' data or raw storage URLs to the model. Images go as inline base64 from the server.
- Respect EXIF orientation and strip EXIF GPS before storing.
- **Tests:**
  - Unit tests for `weatherToClothing` (every band, modifiers, hemisphere), `outfitEngine` (slot rules, dress excludes top+bottom, repeat window, formality filter, colour clash vs neutral, seed determinism, fallback reasons), weather parsing and caching (mocked fetch), and the AI wrappers (schema validation, unknown-id stripping, retry, timeout fallback).
  - Playwright: sign in → upload 3 fixtures → tag review → Style me → wear → see a changed suggestion.
- Seed script with ~25 sample garment cutouts and a demo account so the app looks good immediately.

### 7. Milestones
1. Scaffold, design system (tokens, fonts, dark mode, core components), auth, DB + RLS, landing page.
2. Upload pipeline + wardrobe grid + item drawer.
3. Weather/context + rules engine (TDD) + Today page with rule-only outfits.
4. AI stylist (B3) + feedback loop + saved looks + history.
5. Style DNA import (B2).
6. Planner + trip packing + stats + PWA polish.
7. Stretch:
   - Google Calendar (read-only) → occasion per event.
   - Full-outfit virtual try-on (Gemini image model, selfie + garment cutouts).
   - In-browser FashionCLIP embeddings via Transformers.js as an extra compatibility signal.

At the end, give me a manual QA checklist:
- upload 20+ items
- import notes and inspiration photos
- style for today, tomorrow-in-rain and a cold city via search
- plan a week
- pack for a 4-day trip
- like/dislike and confirm the suggestions adapt

### 8. Inspiration (ideas only, don't copy code)
- Wardrowbe — github.com/Anyesh/wardrowbe (vision tagging → text-model stylist, Open-Meteo, wear history, ratings)
- Wearwell — github.com/crisguooo/personalized-ai-wardrobe (in-browser rules engine: layer structure first, palette strategies, temperature + cold tolerance, explainable preferences, "missing item" view)
- AI-Closet — github.com/LuningLEI/AI-Closet (rules + vectors → LLM composes → LLM reviews; RLS + signed URLs)
- Hangar — github.com/Gurshaan-Deol/Hangar (async upload status pipeline)
- Libre-Closet — github.com/Lazztech/Libre-Closet (PWA, weekly planner with forecast)
- Commercial patterns: Whering, Acloset, Indyx, Cladwell (auto cutout, editable auto-tags, outfit calendar, cost-per-wear, packing lists)

---

## PART B — Runtime prompts (used by the app)

### B1. Garment tagger (vision, one image → JSON)
System:
> You are a precise fashion cataloguer. You see ONE garment photo (background usually removed). Describe only what is visible; never invent brand names. If unsure, lower the confidence rather than guessing. Return JSON matching the schema exactly.

User: `<image>` + "Tag this garment."

Schema:
```json
{
  "category": "top|bottom|dress|outerwear|shoes|accessory|bag",
  "subcategory": "string (e.g. oxford shirt, chinos, chelsea boots)",
  "colors": [{"name": "string", "hex": "#RRGGBB"}],
  "pattern": "solid|stripe|check|floral|print|graphic|other",
  "material": "string (best guess: cotton, denim, wool, leather, synthetic...)",
  "warmth": "1-5 (1 = very light summer, 5 = heavy winter)",
  "formality": "1-5 (1 = loungewear/gym, 3 = smart casual, 5 = black tie)",
  "seasons": ["spring|summer|autumn|winter"],
  "waterproof": "boolean",
  "windproof": "boolean",
  "layerRole": "base|mid|outer|none",
  "fit": "slim|regular|relaxed|oversized|n/a",
  "styleTags": ["max 5: minimal, streetwear, preppy, boho, classic, sporty..."],
  "confidence": {"category": 0.0, "colors": 0.0, "material": 0.0, "warmth": 0.0, "formality": 0.0}
}
```

### B2. Style DNA extractor (notes + inspiration photos → profile)
System:
> You are a personal stylist building a client's style profile from their own notes and inspiration photos. These show what they LIKE or want to look like, not items they own. Extract durable preferences, not one-off details. Use the client's own words for rules. If inputs contradict each other, keep the most recent or most repeated preference and record the conflict. Never override fields listed in `manualOverrides`. Return JSON only.

User: `{ "existingProfile": {...}, "manualOverrides": [...], "notes": ["..."], "photos": [<images>] }`

Schema:
```json
{
  "preferredColors": ["string"],
  "avoidColors": ["string"],
  "silhouettes": ["string (e.g. high-waisted wide-leg, boxy tee, tailored blazer)"],
  "styleKeywords": ["string"],
  "signatureCombos": ["string (e.g. navy blazer + white tee + light denim)"],
  "rules": ["short imperative rule in the client's voice"],
  "coldTolerance": "-2..2 (negative = gets cold easily)",
  "formalityDefault": "1-5",
  "conflicts": ["string"]
}
```

### B3. Stylist (the core outfit prompt)
System:
> You are an expert personal stylist dressing ONE client from THEIR OWN wardrobe for a specific place, weather, date, time and occasion.
>
> Rules:
> 1. Use ONLY item ids that appear in `wardrobe`. Prefer the pre-scored `candidates`, but you may swap a single item for a better one from `wardrobe`. Never invent items or ids.
> 2. Every outfit must be wearable: shoes + (top AND bottom) or a dress. Add a mid layer or outerwear when `targetWarmth` or `requiredFlags` call for it.
> 3. Weather first: total item warmth ≈ `targetWarmth` ±1; rain → waterproof outer/shoes; wind → windproof, no flowy hems; big day swing → a removable layer; high UV → mention sun protection.
> 4. Occasion second: every piece within ±1 of `occasion.formality` and coherent with the others.
> 5. Then taste: follow `styleProfile.rules` strictly; favour preferredColors, silhouettes and signatureCombos; avoid avoidColors; never repeat a disliked combination.
> 6. Colour: at most 3 main colours, at most 1 loud pattern, anchored with neutrals.
> 7. Variety: outfits must differ meaningfully (not the same look with different shoes). Prefer items not worn recently.
> 8. If nothing fully fits (e.g. rain but nothing waterproof), still return the best option, explain it in `compromise`, and describe the item that would fix it in `missingPiece`.
> 9. Voice: a warm, confident stylist. Concrete and short, no fluff. Reference the city and conditions naturally ("Light rain in Frankfurt tonight, 9 °C that feels like 6 °C").
> Return JSON only, matching the schema.

User (compact JSON built by the app):
```json
{
  "context": {
    "city": "Frankfurt", "date": "2026-10-18", "timeSlot": "evening", "localTime": "19:00", "season": "autumn",
    "weather": {"temp": 9, "feelsLike": 6, "dayMin": 5, "dayMax": 13, "precipProb": 60, "windGust": 35, "uv": 0, "summary": "light rain"},
    "targetWarmth": 9, "requiredFlags": ["waterproof"], "avoidFlags": ["suede"],
    "occasion": {"type": "date", "formality": 3, "indoor": true}
  },
  "styleProfile": {"preferredColors": [], "avoidColors": [], "silhouettes": [], "styleKeywords": [], "signatureCombos": [], "rules": [], "coldTolerance": 0},
  "wardrobe": {"<itemId>": {"cat": "top", "sub": "merino crewneck", "colors": ["navy"], "pattern": "solid", "warmth": 3, "formality": 3, "layer": "mid", "wp": false}},
  "candidates": [{"itemIds": ["a", "b", "c", "d"], "ruleScore": 82, "breakdown": {"warmth": 0.9, "color": 0.8, "formality": 0.9, "taste": 0.7, "fresh": 1}}],
  "feedback": {"liked": [["a", "b"]], "disliked": [["c", "e"]]},
  "recentlyWorn": ["x", "y"],
  "count": 4
}
```

Schema:
```json
{
  "outfits": [{
    "title": "string (≤ 5 words)",
    "itemIds": ["string"],
    "score": "0-100",
    "why": "1–2 sentences: why it works for this person and occasion",
    "weatherNote": "1 sentence tying it to the forecast",
    "layeringTip": "string or empty",
    "colorStory": "short phrase, e.g. 'navy + camel on cream'",
    "compromise": "string or empty",
    "missingPiece": "string or empty"
  }],
  "dayAdvice": "1 sentence (umbrella, sunglasses, bring a layer for later...)"
}
```
