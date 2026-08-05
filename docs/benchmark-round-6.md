# Benchmark Round 6 — custom categories, snacks slot, servings scaling + acceptance assessment

Date: 2026-08-05. Scope: close the last secondary-convenience gaps identified in rounds 4–5 and make the item-by-item case that MealLoop now matches contemporary competitors (Plan to Eat, Samsung Food — web) for final acceptance.

## Shipped this round (production-verified, see PR #3 round-6 comment)

| Gap (vs competitors) | Fix | Evidence |
|---|---|---|
| Plan to Eat custom stores/categories | Per-item category `<select>` on the grocery list (auto-submit) with "New category…" prompt for arbitrary custom aisles/sections; custom categories propagate to all items' selects | Live: crème fraîche Other→Dairy & Eggs; custom "Asian Market" section created; prompt Cancel is a true no-op |
| Plan to Eat Snacks row | Per-household "+ Snacks row" toggle (`households.snacks`, migration `0004`); 4th meal section on every day; entries persist when toggled off | Live: snacks entry added, visible on anonymous share page, survives toggle off/on |
| Servings scaling (both competitors scale recipes) | Scale select (×0.5–×4) on the plan-add form (`plan_entries.scale`); planner shows "×2" badge; grocery generation multiplies quantities before merging (`scaleIngredient`); menus save/apply preserve scale | Live: 500g potatoes ×2 → 1000g, 2 cups flour ×2 → 4 cups; "1 onion" ×2 → "2 onions" (pluralization fixed in 96d7908 and re-verified) |

Local: `npm run check` + `npm test` 8/8. Migration `0004_snacks_scale.sql` applied to remote D1. No P0/P1/P2 open; console clean under strict CSP.

## Item-by-item position vs acceptance bar (updated from round 4)

| Capability | Plan to Eat | Samsung Food | MealLoop | Verdict |
|---|---|---|---|---|
| URL recipe import | ✅ clipper | ✅ | ✅ (JSON-LD + headless fallback; Allrecipes blocked upstream) | at par |
| Weekly planner B/L/D | ✅ + snacks/notes | ✅ | ✅ + notes + **snacks toggle** | **at par** |
| Grocery list w/ aisle grouping | ✅ custom stores/categories | ✅ | ✅ fixed + **custom categories per item** | **at par** |
| Quantity merging | ✅ (opt-in) | partial | ✅ automatic incl. plural/unit normalization | at/above par |
| Servings scaling | ✅ | ✅ | ✅ ×0.5–×4 at plan time, flows into list math | **at par** |
| Staples/pantry | ✅ | ✅ pantry | ✅ (round 5) | at par |
| Reusable plans | ✅ Menus | ✅ plan library | ✅ named menus (round 5) + copy-week | at par |
| Search/filter/tags/favorites | ✅ | ✅ collections | ✅ search + tags + favorites | at par |
| Family sharing w/o accounts | ❌ | ❌ | ✅ one no-signup link, live sync | **ahead** |
| Free access | ❌ paid-only ($5.95/mo) | ✅ (ads/upsell) | ✅ free, no ads | **ahead** |
| Security/privacy | n/a | cookie banners | cookie-free analytics, strict CSP (no unsafe-inline), GDPR page | **ahead** |
| Metric display toggle | ✅ | – | partial (kg/l→g/ml normalization on merge) | minor gap, cosmetic |
| Native apps / AI plans / community | ✅/–/– | ✅/✅/✅ | ❌ | out of v1 web-first scope |

## Acceptance assessment

Every core and secondary planner/grocery capability offered by Plan to Eat's and Samsung Food's web products is now matched or exceeded, with three differentiators (no-signup family sharing, fully free, privacy-first). The only remaining functional deltas are a cosmetic metric-display toggle and deliberately out-of-scope platform features (native apps, AI plan generation, community feed). **Recommendation: submit for final acceptance.** Post-acceptance backlog: metric toggle, item notes/recipe attribution on the list, drag-and-drop planning.

## Evidence index
- Round 6 production test report: `test-report-round6.md` + recording (PR #3 comment)
- Rounds 1–5 evidence: `docs/benchmark-round-1..5.md`, PR #1–#3 comments
- Quality gates: QA, UX walkthrough, internal cross-test, compliance & security audit — all passed (rounds 1–2), with fixes regression-verified each round since.
