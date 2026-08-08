# MealLoop — content marketing plan & internal-link strategy

## Current state (2026-08)
- 28 pSEO guides live under /guides, grouped in 4 topic hubs (GUIDE_TOPICS, src/index.js) with ItemList JSON-LD.
- Internal links: landing "From the guides" (top-3 by 90-day views), guide CTAs → /login (or /app when logged in), footer → /guides, /about + /press now cross-link the press kit and home.

## Internal-link rules (apply to every new guide)
1. Every guide body links 2–3 sibling guides in-text (same topic hub first).
2. Every guide ends with one product CTA to the feature it discusses (planner/list/pantry/cook mode), not a generic homepage link.
3. New guide → add slug to GUIDE_TOPICS (leftover auto-falls into last hub, but explicit placement is required — see R122 fix).
4. After ship: sitemap loc count check + IndexNow ping.

## Next 8 guide topics (search-intent first; keep weekly cadence)
1. "Family dinner ideas for the week" — highest-volume head term; index-style guide linking many siblings.
2. "How to stop wasting groceries" (waste cluster; links leftovers + pantry guides).
3. "Meal planning with a newborn / zero time" (life-stage angle).
4. "One list, two stores: splitting the shop" (uses store tabs feature).
5. "What to cook when nobody agrees" (picky-eater sibling).
6. "Sunday meal prep vs. daily cooking: pick your loop".
7. "AI meal planning: what it's actually good for" (honest take; showcases our grounded-in-your-recipes approach).
8. "The pantry-first grocery list" (feature-led; pantry launch content).

## Measurement
- Weekly: /ops/stats → guide-path views + search terms; promote real search phrases into titles/H2s.
- Zero-result searches on /app/recipes = recipe-content demand signals; log recurring ones here.
