# Benchmark Round 3 — quantity merging, recipe search, copy-week

Date: 2026-08-05. Scope: close the three highest-impact gaps vs Plan to Eat / Samsung Food identified in round 1 ("remaining gaps": ingredient quantity aggregation, recipe search/filter, planner ergonomics).

## Gap list → fixes shipped

| # | Gap (vs competitors) | Fix | Production evidence |
|---|---|---|---|
| 1 | Plan to Eat aggregates duplicate ingredients with summed quantities; MealLoop listed duplicates verbatim | `parseIngredient`/`mergeIngredients` in `src/util.js`: parse qty + unit (incl. fractions/vulgar chars), merge on name+unit, sum quantities; still idempotent across repeated clicks | 2× recipes each with "2 tbsp olive oil" + "750g beef mince" → single lines "4 tbsp olive oil" / "1500g beef mince"; second click adds 0 (PR #2 round-3 comment, screenshots) |
| 2 | Both competitors offer recipe search; MealLoop had none | `GET /app/recipes?q=` searches title OR ingredients (household-scoped), no-match state with show-all link | `pesto` → title match only; `carrot` → matches via ingredients; `zzzqq` → empty state (screenshots) |
| 3 | Weekly re-planning friction: competitors support reusing plans | "Copy last week's plan" button on empty weeks, `POST /app/plan/copy-week` maps entries to matching weekdays | Empty week Aug 17 showed button; click copied Mon/Tue dinners from Aug 10; button hidden once week non-empty |

## Verification

- Local: `npm run check` + `npm test` (7/7 incl. new `mergeIngredients` test).
- Production (mealloop.zalize.com, commit 33136d6): all assertions passed by independent test run; full report `test-report-round3.md` + recording; no P0/P1 found.
- Design note (accepted): merging keys on name+unit, so "onion" vs "onions" stay separate lines and mixed units are not converted — acceptable for v1, candidate for later normalization.

## Remaining gaps / round-4 candidates

- CSP still uses `'unsafe-inline'` → nonce-based refactor (P2 from security audit).
- Singular/plural + unit-conversion normalization in merging.
- Recipe collections/tags; pantry exclusion from grocery list.
- Allrecipes import unsupported (upstream anti-bot; manual entry fallback remains).
