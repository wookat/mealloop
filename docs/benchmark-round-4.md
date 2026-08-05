# Benchmark Round 4 — CSP hardening, merge normalization, tags & favorites + competitor re-experience

Date: 2026-08-05. Scope: ship the round-4 P1/P2 items and re-experience Plan to Eat + Samsung Food (logged-in sessions) to reassess distance to the "match contemporary competitors" acceptance bar.

## Shipped this round (all production-verified, see PR #2/#3 comments)

| Item | Fix | Evidence |
|---|---|---|
| CSP `'unsafe-inline'` (security P2) | All inline JS moved to static `/public/app.js` (data-copy, data-confirm, toggle-form, version poll); CSP now `script-src 'self'; style-src 'self'` | curl header check + zero console CSP errors while exercising every JS feature |
| Plural/unit-blind merging | `nameKey` singularizes per word (ies→y, oes/ches/…→drop es, s→drop); unit aliases (lbs→lb, cups→cup…), kg→g and l→ml conversion; count units pluralized in display | "2 onions"+"1 onion"→"3 onions"; "1 kg"+"500g" potatoes→"1500g"; "1 cup"+"2 cups" flour→"3 cups" live |
| No recipe organization | `recipes.tags` (normalized slugs) + `favorite`; ☆ toggle, favorites sort first with ★; tag chip filter `?tag=` with clear/no-match states | Live: tags saved as `quick, family-dinner`, filter/clear verified |

Local: `npm run check` + `npm test` (7/7, merge tests extended). Migration `0002_tags_favorites.sql` applied to remote D1.

## Competitor re-experience (2026-08-05, real logged-in sessions)

Plan to Eat (planner + shop pages): Month/Week planner with Breakfast/Lunch/Dinner/**Snacks/Notes** rows, drag-and-drop from recipe sidebar, **Queue**, **Freezer**, **Menus** (reusable saved plans), recipe **Filters**/courses. Shopping list: date-range based (today/next 7 days/custom), **staples list**, custom **stores + categories**, group-by-store, **merge items** toggle, **metric conversion** toggle, per-item recipe attribution (A/B…), item notes ("or more if needed"), print, grocery-delivery hook. $5.95/mo–$49/yr, no free tier (14-day trial).

Samsung Food (planner + lists): calendar-picker planner, "Get a Personalized Plan" (AI), plan library, Queue, Previous plans, community/Explore feed, recipe box with collections. Free but account-required, app-push heavy, cookie banners/ads.

## Item-by-item position vs acceptance bar

| Capability | Plan to Eat | Samsung Food | MealLoop | Verdict |
|---|---|---|---|---|
| URL recipe import | ✅ clipper | ✅ | ✅ (JSON-LD + headless fallback; Allrecipes blocked upstream) | at par (minus Allrecipes) |
| Weekly planner B/L/D | ✅ + snacks/notes rows | ✅ | ✅ (+notes as free text) | at par; no Snacks slot |
| Grocery list w/ aisle grouping | ✅ custom stores/categories | ✅ | ✅ fixed categories | behind on customization |
| Quantity merging | ✅ (opt-in "Merge Items") | partial | ✅ automatic incl. plural/unit normalization | **at/above par** |
| Metric conversion | ✅ toggle | – | partial (kg/l→g/ml on merge only) | behind (toggle) |
| Staples/pantry | ✅ staples list | ✅ pantry | ❌ | gap (round-5 candidate) |
| Reusable plans | ✅ Menus | ✅ plan library | partial (copy last week) | behind |
| Search/filter/tags/favorites | ✅ filters+courses | ✅ collections | ✅ search + tags + favorites | at par |
| Family sharing w/o accounts | ❌ (accounts) | ❌ (accounts) | ✅ one no-signup link, live sync | **ahead** |
| Free access | ❌ paid-only | ✅ (ads/upsell) | ✅ free, no ads | **ahead** |
| Security/privacy | n/a | cookie banners | cookie-free analytics, strict CSP, GDPR page | **ahead** |
| Native apps / AI plans / community | ✅/–/– | ✅/✅/✅ | ❌ | out of v1 scope (web-first positioning) |

## Objective assessment vs acceptance bar

Core loop (import → plan week → merged aisle-grouped list → no-signup family sync) is at or above the level of both competitors, with unique advantages (no-signup sharing, free, privacy). Remaining functional gaps are secondary conveniences: staples/pantry list, custom categories/stores, metric toggle, reusable named menus, snacks slot. None block the golden path; two (staples, reusable menus) are the highest-value round-5 items to fully clear the bar on planner ergonomics.

## Round-5 candidates (priority order)
1. Staples list (recurring items auto-added to each week's list).
2. Saved menus (name a week's plan, reapply any week) — supersedes copy-last-week.
3. Custom category editing for grocery items.
4. Snacks meal slot (config toggle).

## Traffic snapshot (2026-08-05, cookie-free first-party analytics)
- PV: 255 (single day since launch; predominantly internal QA traffic)
- UV: not tracked (cookie-free by design; no per-visitor ID)
- Email intents: 0; registered users: 4 (all internal test accounts); households: 4
- pSEO/sitemap/IndexNow live; organic traffic not yet expected this early.
